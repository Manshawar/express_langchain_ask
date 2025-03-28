
import { ChatAlibabaTongyi } from "@langchain/community/chat_models/alibaba_tongyi";
import { ChatDeepSeek } from "@langchain/deepseek";
export class GetModel{
  static qwenPlus (config?:any){
    return new ChatAlibabaTongyi({
      // 此处以qwen-plus为例，您可按需更换模型名称。模型列表：https://help.aliyun.com/zh/model-studio/getting-started/models
      model: "deepseek-r1-distill-llama-70b",
      temperature: 1,
      alibabaApiKey: process.env.Ali_APIKEY,
      maxRetries: 0,
      ...config
    })
  }
  static deepSeek (config?:any){
    return  new ChatDeepSeek({
      apiKey:process.env.DEEPSEEK_APIKEY,
      model: "deepseek-chat",
      temperature: 0,
      ...config
    });
  }
 static getModel(modelName: Exclude<keyof typeof GetModel, 'getModel'>, BaseChatModelParams: {
    [key: string]: any;
  }) {
    const model = (GetModel[modelName] as Function)(BaseChatModelParams);
    return model;
  }
}

