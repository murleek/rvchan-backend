import { pipeline } from "stream/promises";
import { Writable } from "stream";

export async function streamToBuffer(
  stream: NodeJS.ReadableStream,
  maxSize = 10 * 1024 * 1024, // 10MB
): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let total = 0;

  await pipeline(
    stream,
    new Writable({
      write(chunk: Buffer, _enc, cb) {
        total += chunk.length;

        if (total > maxSize) {
          cb(new Error("File too large"));
          return;
        }

        chunks.push(chunk);
        cb();
      },
    }),
  );

  return Buffer.concat(chunks);
}
