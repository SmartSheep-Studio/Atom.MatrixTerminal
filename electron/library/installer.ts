import { BrowserWindow } from "electron";
import { webcrypto } from "node:crypto";
import child_process from "node:child_process";
import unzipper from "unzipper";
import axios from "axios";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { store } from "./resolver";

export interface MatrixApp {
  id?: number;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: null;
  slug?: string;
  name?: string;
  description?: string;
  url?: string;
  details?: string;
  tags?: string[];
  is_published?: boolean;
  duplicates?: null;
  transactions?: null;
  profile_id?: number;
}

export interface MatrixRelease {
  name?: string;
  slug?: string;
  description?: string;
  options?: {
    assets?: {
      url?: string;
      decompressor?: string;
      platform?: string;
    }[];
    preprocessing?: {
      script?: string;
      platform?: string;
    }[];
    run_options?: {
      name?: string;
      script?: string;
      platform?: string;
    }[];
  };
}

export interface InstallTask {
  id: string;
  name: string;
  progress: number;
  progress_step: string;
  progress_details?: string;
  description: string;
  is_finished: boolean;
  options: {
    app: MatrixApp;
    release: MatrixRelease;
    window: BrowserWindow;
    workdir: string;
  };
}

export const tasks: { [id: string]: InstallTask } = {};

export async function installApp(
  workdir: string,
  window: BrowserWindow,
  app: MatrixApp,
  release: MatrixRelease
) {
  const task: InstallTask = {
    id: webcrypto.randomUUID(),
    name: `${app.name} ${release.name}`,
    progress: 0,
    progress_step: "Preparing...",
    description: release.description ?? "",
    options: { window, workdir, app, release },
    is_finished: false,
  };

  tasks[task.id] = task;

  task.options.window.webContents.send(
    "tasks:update",
    task.id,
    JSON.parse(JSON.stringify(task))
  );

  await downloadAssets(task);
  await runPreprocessing(task);
  await indexAssets(task);
}

async function downloadAssets(task: InstallTask) {
  const platform = os.platform();
  const assets = task.options.release.options?.assets?.filter(
    (v) => v.platform === platform
  );

  const unzipQueue = [];

  function downloadFile(url: string, output: string) {
    return new Promise(async (resolve, reject) => {
      const writer = fs.createWriteStream(output);

      const res = await axios.get(url as string, {
        responseType: "stream",
      });

      const len = parseInt(res.headers["content-length"], 10);
      let downloaded = 0;

      res.data.on("data", (chunk: any) => {
        downloaded += chunk.length;
        const percent = (downloaded / len) * 100;
        task.progress = percent / 2;
        task.progress_step = "Downloading...";
        task.progress_details = `${downloaded}/${len}`;
        task.options.window.webContents.send(
          "tasks:update",
          task.id,
          JSON.parse(JSON.stringify(task))
        );
      });

      res.data.pipe(writer);

      writer.on("finish", resolve);
      writer.on("error", reject);
    });
  }

  for (const asset of assets ?? []) {
    const output = path.join(
      task.options.workdir,
      `${webcrypto.randomUUID()}.${asset.decompressor}`
    );

    await downloadFile(asset.url as string, output);

    unzipQueue.push(output);
  }

  for (let i = 0; i < unzipQueue.length; i++) {
    const file = unzipQueue[i];

    task.progress_step = "Extracting...";
    task.progress_details = `${i + 1}/${unzipQueue.length}`;
    task.progress = 50 + ((i / unzipQueue.length) * 100) / 4;
    task.options.window.webContents.send(
      "tasks:update",
      task.id,
      JSON.parse(JSON.stringify(task))
    );

    switch (path.extname(file)) {
      case ".zip":
        const stream = fs.createReadStream(file);
        stream.on("close", () => fs.unlinkSync(file));
        stream.pipe(unzipper.Extract({ path: path.dirname(file) }));
        break;
      default:
        console.error(
          new Error("Failed to decompress, unsupported file type!")
        );
    }
  }
}

async function runPreprocessing(task: InstallTask) {
  const platform = os.platform();
  const scripts =
    task.options.release.options?.preprocessing?.filter(
      (v) => v.platform === platform
    ) ?? [];

  for (let i = 0; i < scripts.length; i++) {
    task.progress_step = "Preprocessing...";
    task.progress_details = `${i + 1}/${scripts.length}`;
    task.progress = 75 + ((i / scripts.length) * 100) / 4;
    task.options.window.webContents.send(
      "tasks:update",
      task.id,
      JSON.parse(JSON.stringify(task))
    );

    child_process.exec(scripts[i].script as string, {
      cwd: task.options.workdir,
    });
  }
}

async function indexAssets(task: InstallTask) {
  task.progress_step = "Indexing...";
  task.progress_details = "0 secs";
  task.progress = 100;
  task.options.window.webContents.send(
    "tasks:update",
    task.id,
    JSON.parse(JSON.stringify(task))
  );

  const apps = (store.get("library.apps") as any[]) ?? [];
  apps.push({
    id: webcrypto.randomUUID(),
    app: task.options.app,
    release: task.options.release,
    path: task.options.workdir,
  });

  store.set("library.apps", apps);

  task.progress_step = "Finished";
  task.progress_details = "Go play now";
  task.progress = 100;
  task.is_finished = true;
  task.options.window.webContents.send(
    "tasks:update",
    task.id,
    JSON.parse(JSON.stringify(task))
  );
}
