import { Request, Response } from "express";
import { Rag } from '../services/rag';
export class AI {
  static async ask(req: Request, res: Response): Promise<void> {
    const { query } = req.body;
    const rag = new Rag(req.app.locals.intVus.vectorStore);
    
    // 设置流式响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      const stream = await rag.ragChain.stream({
        question: query,
      }, {
        configurable: { sessionId: "test-history" },
      });

      // 创建可读流
      for await (const chunk of stream) {
        // 将每个chunk以SSE格式发送
        console.log(chunk)
        res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
        // 确保数据立即发送
        // req.socket?.once('close', () => stream.return());
      }
    } catch (error) {
      res.write(`event: error\ndata: ${JSON.stringify({ error: '处理请求时发生错误' })}\n\n`);
    } finally {
      // 结束流
      res.write('event: end\ndata: {}\n\n');
      res.end();
    }
  }
}