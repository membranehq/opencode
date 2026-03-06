import fs from "fs/promises"
import path from "path"
import { Global } from "../global"
import { Identifier } from "../id/id"
import { PermissionNext } from "../permission/next"
import type { Agent } from "../agent/agent"
import { Scheduler } from "../scheduler"

export namespace Truncate {
  export const MAX_LINES = 2000
  export const MAX_BYTES = 50 * 1024
  export const DIR = path.join(Global.Path.data, "tool-output")
  export const GLOB = path.join(DIR, "*")
  const RETENTION_MS = 7 * 24 * 60 * 60 * 1000 // 7 days
  const HOUR_MS = 60 * 60 * 1000

  export type Result = { content: string; truncated: false } | { content: string; truncated: true; outputPath: string }

  export interface Options {
    maxLines?: number
    maxBytes?: number
    direction?: "head" | "tail" | "middle"
  }

  export function init() {
    Scheduler.register({
      id: "tool.truncation.cleanup",
      interval: HOUR_MS,
      run: cleanup,
      scope: "global",
    })
  }

  export async function cleanup() {
    const cutoff = Identifier.timestamp(Identifier.create("tool", false, Date.now() - RETENTION_MS))
    const glob = new Bun.Glob("tool_*")
    const entries = await Array.fromAsync(glob.scan({ cwd: DIR, onlyFiles: true })).catch(() => [] as string[])
    for (const entry of entries) {
      if (Identifier.timestamp(entry) >= cutoff) continue
      await fs.unlink(path.join(DIR, entry)).catch(() => {})
    }
  }

  function hasTaskTool(agent?: Agent.Info): boolean {
    if (!agent?.permission) return false
    const rule = PermissionNext.evaluate("task", "*", agent.permission)
    return rule.action !== "deny"
  }

  export async function output(text: string, options: Options = {}, agent?: Agent.Info): Promise<Result> {
    const maxLines = options.maxLines ?? MAX_LINES
    const maxBytes = options.maxBytes ?? MAX_BYTES
    const direction = options.direction ?? "middle"
    const lines = text.split("\n")
    const totalBytes = Buffer.byteLength(text, "utf-8")

    if (lines.length <= maxLines && totalBytes <= maxBytes) {
      return { content: text, truncated: false }
    }

    const id = Identifier.ascending("tool")
    const filepath = path.join(DIR, id)
    await Bun.write(Bun.file(filepath), text)

    const hint = hasTaskTool(agent)
      ? `The tool call succeeded but the output was truncated. Full output saved to: ${filepath}\nUse the Task tool to have explore agent process this file with Grep and Read (with offset/limit). Do NOT read the full file yourself - delegate to save context.`
      : `The tool call succeeded but the output was truncated. Full output saved to: ${filepath}\nUse Grep to search the full content or Read with offset/limit to view specific sections.`

    if (direction === "middle") {
      const HEAD_SHARE = 0.3
      const headMaxLines = Math.max(1, Math.floor(maxLines * HEAD_SHARE))
      const tailMaxLines = Math.max(1, maxLines - headMaxLines)
      const headMaxBytes = Math.floor(maxBytes * HEAD_SHARE)
      const tailMaxBytes = maxBytes - headMaxBytes

      const headOut: string[] = []
      let headBytes = 0
      let headHitBytes = false
      for (let i = 0; i < lines.length && headOut.length < headMaxLines; i++) {
        const size = Buffer.byteLength(lines[i], "utf-8") + (i > 0 ? 1 : 0)
        if (headBytes + size > headMaxBytes) {
          headHitBytes = true
          break
        }
        headOut.push(lines[i])
        headBytes += size
      }

      const tailOut: string[] = []
      let tailBytes = 0
      let tailHitBytes = false
      for (let i = lines.length - 1; i >= headOut.length && tailOut.length < tailMaxLines; i--) {
        const size = Buffer.byteLength(lines[i], "utf-8") + (tailOut.length > 0 ? 1 : 0)
        if (tailBytes + size > tailMaxBytes) {
          tailHitBytes = true
          break
        }
        tailOut.unshift(lines[i])
        tailBytes += size
      }

      const keptLines = headOut.length + tailOut.length
      const keptBytes = headBytes + tailBytes
      const hitBytes = headHitBytes || tailHitBytes
      const removed = hitBytes ? totalBytes - keptBytes : lines.length - keptLines
      const unit = hitBytes ? "bytes" : "lines"

      const message = `${headOut.join("\n")}\n\n...${removed} ${unit} truncated...\n\n${hint}\n\n${tailOut.join("\n")}`
      return { content: message, truncated: true, outputPath: filepath }
    }

    const out: string[] = []
    let i = 0
    let bytes = 0
    let hitBytes = false

    if (direction === "head") {
      for (i = 0; i < lines.length && i < maxLines; i++) {
        const size = Buffer.byteLength(lines[i], "utf-8") + (i > 0 ? 1 : 0)
        if (bytes + size > maxBytes) {
          hitBytes = true
          break
        }
        out.push(lines[i])
        bytes += size
      }
    } else {
      for (i = lines.length - 1; i >= 0 && out.length < maxLines; i--) {
        const size = Buffer.byteLength(lines[i], "utf-8") + (out.length > 0 ? 1 : 0)
        if (bytes + size > maxBytes) {
          hitBytes = true
          break
        }
        out.unshift(lines[i])
        bytes += size
      }
    }

    const removed = hitBytes ? totalBytes - bytes : lines.length - out.length
    const unit = hitBytes ? "bytes" : "lines"
    const preview = out.join("\n")

    const message =
      direction === "head"
        ? `${preview}\n\n...${removed} ${unit} truncated...\n\n${hint}`
        : `...${removed} ${unit} truncated...\n\n${hint}\n\n${preview}`

    return { content: message, truncated: true, outputPath: filepath }
  }
}
