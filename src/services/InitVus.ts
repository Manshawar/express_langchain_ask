
import { Milvus } from '@langchain/community/vectorstores/milvus';
import { MilvusClient, DataType, DescribeCollectionResponse } from '@zilliz/milvus2-sdk-node';
import { MilvusEnum } from "./enum"
import { exec } from 'child_process';
import fs, { existsSync } from 'fs';
import { join } from 'path';
import "dotenv/config";
import { AlibabaTongyiEmbeddings } from "@langchain/community/embeddings/alibaba_tongyi";
import { config } from "../config/milvus"
import type { Document } from "@langchain/core/documents"
import { SplitDocs } from "../utils/splitDocs"
export class InitVus {
  embeddings: AlibabaTongyiEmbeddings;
  splitDocs: Document[];
  milvusclient: MilvusClient
  collectInfo: DescribeCollectionResponse
  isExistCollect: boolean
  vectorStore: Milvus
  private readonly BATCH_SIZE = 50; // 控制每批处理量
  private readonly BATCH_DELAY = 2000; // 每批之间的延迟（毫秒）
  constructor() {

    this.embeddings = this.initEmbedding()
    this.init()
  }
  async init() {

   let res=await this.InitMilvus()
    // console.log(res)
    return res
  }
  async InitMilvus() {
    this.getGit()    
    this.milvusclient = new MilvusClient({
      address: config.clientConfig.address,
      database: config.clientConfig.database
    });
    this.collectInfo = await this.milvusclient.describeCollection({
      collection_name: config.collectionName
    });
    this.isExistCollect = this.collectInfo.status.code !== 0;
    if (MilvusEnum[this.collectInfo.status.code] === "未建表") {
      await this.createCollectionWithBatchInsert();
      this.splitDocs = await SplitDocs.init()
      for (let i = 0; i < this.splitDocs.length; i += this.BATCH_SIZE) {
        const batch = this.splitDocs.slice(i, i + this.BATCH_SIZE);

        // 3. 插入当前批次
        await Milvus.fromDocuments(
          batch,
          this.embeddings,
          config
        );

        // 4. 添加延迟（避免速率限制）
        if (i + this.BATCH_SIZE < this.splitDocs.length) {
          await new Promise(resolve =>
            setTimeout(resolve, this.BATCH_DELAY)
          );
        }
      }
    return  this.getVectore()
    }
  return  this.getVectore()
  }
  private async createCollectionWithBatchInsert() {
    await this.milvusclient.createCollection({
      collection_name: config.collectionName,
      fields: [
        {
          name: "langchain_primaryid",
          data_type: DataType.Int64,
          is_primary_key: true,
          autoID: true // 启用自动生成ID
        },
        {
          name: "langchain_text",
          data_type: DataType.VarChar,
          max_length: 65535 // 最大支持长度
        },
        {
          name: "langchain_vector",
          data_type: DataType.FloatVector,
          dim: 1536 // 根据实际嵌入维度调整
        },
        {
          name: "source",
          data_type: DataType.VarChar,
          max_length: 512 // 支持长路径
        },
        {
          name: "loc",
          data_type: DataType.JSON // 存储复杂定位信息
        }
      ]
    });
    await this.milvusclient.createIndex({
      collection_name: config.collectionName,
      field_name: "langchain_vector",
      index_type: "IVF_FLAT", // 根据数据量选择
      metric_type: "L2",
      params: { nlist: 1024 }
    });

    await this.milvusclient.createIndex({
      collection_name: config.collectionName,
      field_name: "source",
      index_type: "Trie" // 高效前缀匹配
    });
  }
  private initEmbedding() {
    return new AlibabaTongyiEmbeddings({
      apiKey: process.env.Ali_APIKEY,
      modelName: "text-embedding-v2",
    });
  }
  private  getGit(repoUrl = process.env.REPO_URL) {
    const repoName = process.env.REPO_NAME
    const repoPath = join(process.cwd(), repoName);

    if (!existsSync(repoPath)) {
      // 如果目录不存在，执行 clone
      const cloneCommand = `git clone ${repoUrl}`;
      exec(cloneCommand, (error, stdout, stderr) => {
        if (error) {
          console.error(`克隆错误: ${error.message}`);
          return;
        }
        if (stderr) {
          console.error(`错误输出: ${stderr}`);
          return;
        }
        console.log(`克隆成功: ${stdout}`);
      });
    } else {
      // 如果目录存在，执行 pull
      const pullCommand = `cd ${repoPath} && git pull`;
      exec(pullCommand, (error, stdout, stderr) => {
        if (error) {
          console.error(`拉取错误: ${error.message}`);
          return;
        }
        if (stderr) {
          console.error(`错误输出: ${stderr}`);
          return;
        }
        console.log(`拉取成功: ${stdout}`);
      });
    }
  }
  private async getVectore(){
   return this.vectorStore = await Milvus.fromExistingCollection(
      this.embeddings, // 你的embedding模型
      config
    );
  }
}
