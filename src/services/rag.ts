import { AlibabaTongyiEmbeddings } from "@langchain/community/embeddings/alibaba_tongyi";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { HumanMessage, AIMessage } from "@langchain/core/messages"
import { RunnablePassthrough, RunnableSequence, RunnableWithMessageHistory } from "@langchain/core/runnables";
import {JSONChatHistory} from "../utils/JSONChatHistory"
import { ChatAlibabaTongyi } from "@langchain/community/chat_models/alibaba_tongyi";
import { StringOutputParser } from "@langchain/core/output_parsers"
import { ChatDeepSeek } from "@langchain/deepseek";
import { StringPromptValue } from "@langchain/core/prompt_values";
import { Document } from "@langchain/core/documents";
import {GetModel} from "../utils/model"
import "dotenv/config"
import { VectorStoreRetriever } from "@langchain/core/vectorstores";
import { Milvus } from "@langchain/community/vectorstores/milvus";
import { RedisChatMessageHistory } from "@langchain/redis";
const rephraseChainPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    "给定以下对话和一个后续问题，请将后续问题重述为一个独立的问题。请注意，重述的问题应该包含足够的信息，使得没有看过对话历史的人也能理解。",
  ],
  new MessagesPlaceholder("history"),
  ["human", "将以下问题重述为一个独立的问题：\n{question}"],
]);
const SYSTEM_TEMPLATE = `
您是一位专业前端技术顾问，核心能力聚焦于Vite构建工具及其技术生态，你可以熟练使用vue和react。回答策略：
1. 严格基于我的博客技术资产（版本：2024.1）
2. 对Vite相关问题优先匹配：
   - 原创解决方案（含代码示例）
   - 已验证的配置片段
   - 性能优化实践 
3. 回答格式要求：
   - 技术描述后附带 md格式的代码块/配置块
   - 关键参数用**加粗**强调
   - 复杂流程分步骤说明
4. 超出知识边界时：
   - 明确告知"该主题尚未在博客深度解析"
   - 提示"第三方方案可能存在版本兼容风险"
   - 引导至相关领域文章（格式：《文章标题》）
真实性声明：
"以下回答完全基于博客技术沉淀，外部技术方案未经验证可能存在不准确性，生产环境使用建议充分测试"

技术讨论区：
{context}

请以工程师对等交流方式回答，保持技术严谨性同时具备可读性。回答开头统一使用："您好，根据博客技术文档：" 
`;
const convertDocsToString = (documents: Document[]): string => {
  return documents.map((document) => document.pageContent).join("\n");
};

interface RagConfigType {
  modelName: Exclude<keyof typeof GetModel, 'getModel'>,
  BaseChatModelParams?:{
    [key: string]: any;
  }
}
export class Rag {
  model: ChatAlibabaTongyi|ChatDeepSeek;
  vecStore:Milvus
  ragChain
  constructor
  (vecStore:Milvus,config:RagConfigType = {modelName : "qwenPlus",BaseChatModelParams:{}}) {
    this.vecStore = vecStore
    this.model = GetModel.getModel(config.modelName,config.BaseChatModelParams);
   this.ragChain= this.init()
  }
  init(){
    // console.log(this.rephraseChain())
   const rephraseChain= this.rephraseChain();
   const contextRetrieverChain= this.contextRetrieverChain()

    const prompt = ChatPromptTemplate.fromMessages([
      ["system",SYSTEM_TEMPLATE],
      new MessagesPlaceholder("history"),
      ["human", "现在，你需要基于原文，回答以下问题：\n{standalone_question}`"],
    ])
    const ragChain = RunnableSequence.from([
      RunnablePassthrough.assign({
        standalone_question: rephraseChain,
      }),
      RunnablePassthrough.assign({
        context:contextRetrieverChain
      }),
      prompt,
      this.model,
      new StringOutputParser()
    ])
    const ragChainWithHistory = new RunnableWithMessageHistory({
      runnable:ragChain,
      getMessageHistory:(sessionId)=>new RedisChatMessageHistory({
        sessionId: sessionId,
        sessionTTL:Number.parseInt( process.env.REDIS_TTL),
        config:{
          url:process.env.REDIS_URL,
          database:Number.parseInt(process.env.REDIS_DATABASE)
        }
      }),
      historyMessagesKey: "history",
      inputMessagesKey: "question",
    })
    return ragChainWithHistory
  }
  rephraseChain(){
   return RunnableSequence.from([
      rephraseChainPrompt,
      GetModel.getModel("qwenPlus",{temperature: 0.2,})
      ,
      new StringOutputParser(),
    ]);
  }
  contextRetrieverChain(){
    const retriever = this.vecStore.asRetriever(2);

    return RunnableSequence.from([
      (input) => input.standalone_question,
      retriever,
      convertDocsToString,
    ]);
  }
}
