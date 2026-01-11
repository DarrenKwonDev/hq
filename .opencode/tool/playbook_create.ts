import { tool } from "@opencode-ai/plugin"
import * as fs from "fs"
import * as path from "path"

type CreateLog = {
  created: string[]
  skipped: string[]
}

function assertSafeDirName(name: string) {
  const trimmed = name.trim()
  if (!trimmed) throw new Error("Invalid TITLE: empty")
  if (trimmed.includes("/") || trimmed.includes("\\") || trimmed.includes("..")) {
    throw new Error(`Invalid TITLE: ${name}. Path characters not allowed.`)
  }
}

function formatMarkerBody(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length === 0) return "-"

  return lines
    .map((line) => (line.startsWith("-") ? line : `- ${line}`))
    .join("\n")
}

async function ensureDir(dirPath: string, log: CreateLog) {
  const existed = fs.existsSync(dirPath)
  await fs.promises.mkdir(dirPath, { recursive: true })
  const rel = path.relative(process.cwd(), dirPath)
  if (existed) log.skipped.push(rel)
  else log.created.push(rel)
}

async function writeFileIfMissing(
  filePath: string,
  content: string,
  log: CreateLog,
) {
  try {
    await fs.promises.writeFile(filePath, content, { flag: "wx" })
    log.created.push(path.relative(process.cwd(), filePath))
  } catch (error) {
    const code = (error as { code?: string } | null)?.code
    if (code === "EEXIST") {
      log.skipped.push(path.relative(process.cwd(), filePath))
      return
    }
    throw error
  }
}

function notebookTemplateIpynb(args: {
  title: string
  content: string
}) {
  return JSON.stringify(
    {
      cells: [
        {
          cell_type: "markdown",
          metadata: {},
          source: args.content.split("\n").map((line) => `${line}\n`),
        },
      ],
      metadata: {
        kernelspec: {
          display_name: "Python 3",
          language: "python",
          name: "python3",
        },
        language_info: {
          name: "python",
        },
      },
      nbformat: 4,
      nbformat_minor: 5,
    },
    null,
    2,
  )
}

export default tool({
  description: "Create playbook research folder",
  args: {
    TITLE: tool.schema.string().describe("Concise strategy/edge name"),
    HYPOTHESIS_EDGE: tool.schema.string().describe("Structural edge definition"),
    MECHANISM: tool.schema.string().describe("Why the edge exists"),
    TESTABLE_CLAIM: tool.schema.string().describe("Falsifiable, testable claim"),

    createNotebook: tool.schema
      .boolean()
      .optional()
      .default(true)
      .describe("Create {TITLE}.ipynb"),
  },
  async execute(args, context) {
    assertSafeDirName(args.TITLE)

    const baseDir = path.resolve(process.cwd(), "playbook")
    const researchDir = path.join(baseDir, args.TITLE)

    const log: CreateLog = { created: [], skipped: [] }

    await ensureDir(researchDir, log)
    await ensureDir(path.join(researchDir, "figures"), log)
    await ensureDir(path.join(researchDir, "data"), log)
    await ensureDir(path.join(researchDir, "config"), log)

    const createdAt = new Date().toISOString()

    await writeFileIfMissing(path.join(researchDir, "config", "hyperparam.yaml"), "", log)
    await writeFileIfMissing(path.join(researchDir, "config", "constants.yaml"), "", log)

    const reportContent = [
      `# ${args.TITLE}`,
      "",
      `- Research folder: ${path.relative(process.cwd(), researchDir)}`,
      `- Created: ${createdAt}`,
      `- Session: ${context.sessionID}`,
      "",
      "[TITLE]",
      formatMarkerBody(args.TITLE),
      "",
      "[HYPOTHESIS_EDGE]",
      formatMarkerBody(args.HYPOTHESIS_EDGE),
      "",
      "[MECHANISM]",
      formatMarkerBody(args.MECHANISM),
      "",
      "[TESTABLE_CLAIM]",
      formatMarkerBody(args.TESTABLE_CLAIM),
      "",
    ].join("\n")

    await writeFileIfMissing(path.join(researchDir, "report.md"), reportContent, log)

    if (args.createNotebook) {
      await writeFileIfMissing(
        path.join(researchDir, `${args.TITLE}.ipynb`),
        notebookTemplateIpynb({ title: args.TITLE, content: reportContent }),
        log,
      )
    }

    const gitignoreHint =
      "Note: repo `.gitignore` currently ignores `playbook/**`. " +
      "If you want to commit `report.md` or templates, add negation rules."

    return [
      `Playbook: ${path.relative(process.cwd(), researchDir)}`,
      "",
      log.created.length
        ? `Created (${log.created.length}):\n- ${log.created.join("\n- ")}`
        : "Created (0)",
      "",
      log.skipped.length
        ? `Skipped (${log.skipped.length}) already existed:\n- ${log.skipped.join("\n- ")}`
        : "Skipped (0)",
      "",
      gitignoreHint,
    ].join("\n")
  },
})
