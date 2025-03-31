/// <reference types="node" />

declare namespace NodeJS {
  interface ProcessEnv {
    /** 当前环境变量中的默认模型配置 */
    DEFAULT_MODEL: "qwenPlus" | "deepSeek";
    
    // 保留Node.js原生环境变量类型（可选）
    [key: string]: string | undefined;
  }
}