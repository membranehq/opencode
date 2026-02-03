#!/usr/bin/env bun
/**
 * Create a new Membrane release tag and optionally build.
 *
 * Usage:
 *   bun run script/membrane-release.ts <version>
 *   bun run script/membrane-release.ts <version> --build
 *
 * Examples:
 *   bun run script/membrane-release.ts 1.0.0          # Creates tag membrane-v1.0.0
 *   bun run script/membrane-release.ts 1.0.1 --build  # Creates tag and builds binary
 */

import { $ } from 'bun'

const version = process.argv[2]
const shouldBuild = process.argv.includes('--build')

if (!version) {
  console.error('Usage: bun run script/membrane-release.ts <version> [--build]')
  console.error('Example: bun run script/membrane-release.ts 1.0.0')
  process.exit(1)
}

// Validate version format (semver-ish)
if (!/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(version)) {
  console.error(`Invalid version format: ${version}`)
  console.error('Expected format: X.Y.Z or X.Y.Z-suffix')
  process.exit(1)
}

const tagName = `membrane-v${version}`
const fullVersion = `${version}-membrane`

async function main() {
  // Ensure we're on membrane branch
  const currentBranch = (await $`git branch --show-current`.text()).trim()
  if (currentBranch !== 'membrane') {
    console.error(`Error: Must be on 'membrane' branch (currently on '${currentBranch}')`)
    process.exit(1)
  }

  // Check for uncommitted changes
  const status = (await $`git status --porcelain`.text()).trim()
  if (status) {
    console.error('Error: Working directory has uncommitted changes')
    process.exit(1)
  }

  // Check if tag already exists
  const existingTags = await $`git tag -l ${tagName}`.text()
  if (existingTags.trim()) {
    console.error(`Error: Tag ${tagName} already exists`)
    process.exit(1)
  }

  console.log(`Creating release ${tagName}...\n`)

  // Create and push tag
  await $`git tag ${tagName}`
  console.log(`Created tag: ${tagName}`)

  await $`git push origin ${tagName}`.nothrow() // nothrow in case hooks fail
  console.log(`Pushed tag: ${tagName}`)

  // Build if requested
  if (shouldBuild) {
    console.log(`\nBuilding with version ${fullVersion}...`)
    await $`bun run packages/opencode/script/build.ts --single`.env({
      ...process.env,
      OPENCODE_VERSION: fullVersion,
    })
    console.log('Build complete!')
  }

  console.log(`\nRelease ${tagName} created successfully!`)

  if (!shouldBuild) {
    console.log(`\nTo build with this version:`)
    console.log(`  OPENCODE_VERSION=${fullVersion} bun run packages/opencode/script/build.ts --single`)
  }
}

main().catch((error) => {
  console.error('Release failed:', error.message)
  process.exit(1)
})
