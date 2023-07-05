import child_process from "node:child_process";

export function launchApp(option: any, run: any) {
  child_process.exec(run.script, { cwd: option.path }, (err, stdout, stderr) => {
    if(err) console.error(err)
    if(stdout) console.log(stdout)
    if(stderr) console.log(stderr)
  });
}
