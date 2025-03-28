
import path from 'path';
import { TextLoader } from "langchain/document_loaders/fs/text";
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import type { Document } from "@langchain/core/documents"
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
export class SplitDocs {
  static async init() {

    let docs = await this.splitDocs(await this.mdLoader())
    return docs
  }
  static async mdLoader(docPath = path.join(process.cwd(), process.env.REPO_DOC)) {
    const directoryLoader = new DirectoryLoader(
      docPath,
      {
        ".md": (path: string) => {
          return new TextLoader(path)
        },
        ".mdx": (path: string) => new TextLoader(path)
      },
    );
    const docs = await directoryLoader.load();
    return docs
  }
  static async splitDocs(docs: Document[]) {
    const Splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 100,
      chunkOverlap: 20,
    })
    let splitDocs = await Splitter.splitDocuments(docs)
    return splitDocs
  }
}