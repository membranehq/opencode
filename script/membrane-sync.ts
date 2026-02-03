#!/usr/bin/env bun
/**
 * Sync membrane branch with upstream opencode.
 *
 * Usage:
 *   bun run script/membrane-sync.ts          # Sync with upstream/dev (default)
 *   bun run script/membrane-sync.ts --main   # Sync with upstream/main (stable)
 *
 * This script will:
 * 1. Ensure upstream remote exists
 * 2. Fetch latest from upstream
 * 3. Merge upstream/dev (or main) into membrane branch
 * 4. Stop if there are conflicts (you resolve manually)
 */

import { $ } from 'bun'

const useMain = process.argv.includes('--main')
const upstreamBranch = useMain ? 'main' : 'dev'

async function main() {
  // Ensure we're on membrane branch
  const currentBranch = (await $`git branch --show-current`.text()).trim()
  if (currentBranch !== 'membrane') {
    console.error(`Error: Must be on 'membrane' branch (currently on '${currentBranch}')`)
    console.error('Run: git checkout membrane')
    process.exit(1)
  }

  // Check for uncommitted changes
  const status = (await $`git status --porcelain`.text()).trim()
  if (status) {
    console.error('Error: Working directory has uncommitted changes')
    console.error('Commit or stash your changes first')
    process.exit(1)
  }

  console.log(`Syncing membrane with upstream/${upstreamBranch}...\n`)

  // Ensure upstream remote exists
  const remotes = await $`git remote`.text()
  if (!remotes.includes('upstream')) {
    console.log('Adding upstream remote...')
    await $`git remote add upstream https://github.com/anomalyco/opencode.git`
  }

  // Fetch upstream
  console.log('Fetching upstream...')
  await $`git fetch upstream`

  // Get current and upstream commits for comparison
  const localCommit = (await $`git rev-parse HEAD`.text()).trim()
  const upstreamCommit = (await $`git rev-parse upstream/${upstreamBranch}`.text()).trim()

  // Check if already up-to-date
  const mergeBase = (await $`git merge-base HEAD upstream/${upstreamBranch}`.text()).trim()
  if (mergeBase === upstreamCommit) {
    console.log(`Already up-to-date with upstream/${upstreamBranch}`)
    return
  }

  // Show what's coming
  const commitCount = (
    await $`git rev-list --count ${mergeBase}..upstream/${upstreamBranch}`.text()
  ).trim()
  console.log(`\nMerging ${commitCount} commit(s) from upstream/${upstreamBranch}...`)

  // Attempt merge
  const mergeResult = await $`git merge upstream/${upstreamBranch} -m "chore: sync with upstream/${upstreamBranch}"`.nothrow()

  if (mergeResult.exitCode !== 0) {
    console.error('\nMerge conflicts detected!')
    console.error('Please resolve conflicts manually, then:')
    console.error('  git add .')
    console.error('  git commit')
    console.error('  git push origin membrane')
    process.exit(1)
  }

  console.log('\nMerge successful!')
  console.log('\nTo push changes:')
  console.log('  git push origin membrane')
}

main().catch((error) => {
  console.error('Sync failed:', error.message)
  process.exit(1)
})
