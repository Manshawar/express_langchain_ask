import path,{join} from "path";
import fs,{existsSync} from "fs-extra";
import { exec } from 'child_process';
export  function initGit(repoUrl = process.env.REPO_URL){

   return new Promise((resolve,reject)=>{
    const repoName = process.env.REPO_NAME;
    const repoPath = join(process.cwd(), repoName);

    const removeGitDir = () => {
      try {
        fs.rmSync(join(repoPath, '.git'), { recursive: true, force: true });
        console.log('成功删除.git目录');
        resolve("ok")
      } catch (err) {
        reject("err")
        console.error('删除.git目录失败:', err);
      }
    };

    // // 强制删除已存在的仓库目录
    if (existsSync(repoPath)) {
      try {
        fs.rmSync(repoPath, { recursive: true, force: true });
        console.log(`已删除现有仓库目录: ${repoPath}`);
      } catch (err) {
        console.error('删除仓库目录失败:', err);
        return;
      }
    }

    // 执行克隆操作
    const cloneCommand = `git clone ${repoUrl}`;
    console.log(cloneCommand)
    exec(cloneCommand, (error, stdout, stderr) => {
      if (error) {
        console.error(`克隆错误: ${error.message}`);
        if (stderr) console.error(`错误输出: ${stderr}`);
        return;
      }
      
      // 仅在成功完成时删除.git目录
      console.log(`克隆成功: ${stdout}`);
   
      removeGitDir();
    });
   })
  
}