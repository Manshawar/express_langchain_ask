import { MilvusClient, DataType } from '@zilliz/milvus2-sdk-node';
import { createObjectCsvWriter } from 'csv-writer';
import fs from 'fs';

// 配置区 ----------------------------------------
const CONFIG = {
  MILVUS_HOST: 'localhost',
  MILVUS_PORT: '19530',
  DATABASE_NAME: 'docs',
  COLLECTION_NAME: 'blog',
  MAX_FILE_SIZE: 180 * 1024 * 1024, // 180MB (字节)
  BATCH_SIZE: 5000
};
// -----------------------------------------------

// 全局状态管理
let currentFileIndex = 1;
let currentFilePath = '';
let csvWriter: any = null;
let fields: any[] = [];

async function initNewFile() {
  currentFilePath = `./${CONFIG.COLLECTION_NAME}_part_${currentFileIndex}.csv`;
  
  // 创建新的 CSV Writer
  csvWriter = createObjectCsvWriter({
    path: currentFilePath,
    header: fields.map(f => ({ id: f.name, title: f.name })),
    alwaysQuote: true
  });

  // 创建空文件并写入头
  fs.writeFileSync(currentFilePath, '');
  await csvWriter.writeRecords([]); // 强制写入 header
}

async function checkFileSize() {
  try {
    const stats = fs.statSync(currentFilePath);
    return stats.size;
  } catch {
    return 0;
  }
}

async function exportBlogCollection() {
  const milvus = new MilvusClient({
    address: `${CONFIG.MILVUS_HOST}:${CONFIG.MILVUS_PORT}`,
    database: CONFIG.DATABASE_NAME
  });

  // 验证集合
  const { value: collectionExists } = await milvus.hasCollection({
    collection_name: CONFIG.COLLECTION_NAME
  });
  if (!collectionExists) throw new Error('集合不存在');

  // 加载集合
  await milvus.loadCollectionSync({
    collection_name: CONFIG.COLLECTION_NAME
  });

  // 获取字段结构
  const { schema } = await milvus.describeCollection({
    collection_name: CONFIG.COLLECTION_NAME
  });
  fields = schema.fields;

  // 初始化第一个文件
  await initNewFile();

  let offset = 0;
  let totalExported = 0;

  // 分页导出循环
  while (true) {
    const { data } = await milvus.query({
      collection_name: CONFIG.COLLECTION_NAME,
   
      offset: offset,
      limit: CONFIG.BATCH_SIZE,
      output_fields: ['*']
    });

    if (!data || data.length === 0) break;

    // 处理向量字段
    const processedData = data.map((record: any) => {
      fields.forEach(field => {
        if ([DataType.FloatVector, DataType.BinaryVector].includes(field.data_type)) {
          record[field.name] = record[field.name].join(',');
        }
      });
      return record;
    });

    // 写入当前文件
    await csvWriter.writeRecords(processedData);
    totalExported += processedData.length;

    // 检查文件大小
    const currentSize = await checkFileSize();
    if (currentSize >= CONFIG.MAX_FILE_SIZE) {
      currentFileIndex++;
      await initNewFile();
    }

    console.log(`已导出 ${totalExported} 条，当前文件: ${currentFilePath}`);
    offset += CONFIG.BATCH_SIZE;
  }

  console.log(`\n导出完成！共生成 ${currentFileIndex} 个文件`);
}

// 执行导出
exportBlogCollection()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('失败:', err.message);
    process.exit(1);
  });