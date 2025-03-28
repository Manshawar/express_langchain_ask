import "dotenv/config"
export const config ={
  clientConfig: {
    address: process.env.MILVUS_ADDRESS,
    database: process.env.MILVUS_DATABASE,
  },
  collectionName:process.env.MILVUS_COLLECTIONNAME, // 固定集合名称
   vectorField: process.env.MILVUS_COLLECTIONNAME
}