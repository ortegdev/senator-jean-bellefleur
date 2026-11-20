#!/usr/bin/env tsx

/**
 * Next.js 15 / React 19 Upgrade Compatibility Checker
 * 
 * This script scans the codebase for patterns that need updating
 * after upgrading to Next.js 15 and React 19.
 */

import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

interface Issue {
  file: string;
  line: number;
  type: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  snippet?: string;
}

const issues: Issue[] = [];

async function* walkFiles(dir: string): AsyncGenerator<string> {
  const entries = await readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const path = join(dir, entry.name);
    
    // Skip node_modules, .next, .git
    if (['node_modules', '.next', '.git', 'dist', 'build'].includes(entry.name)) {
      continue;
    }
    
    if (entry.isDirectory()) {
      yield* walkFiles(path);
    } else if (entry.isFile() && /\.(tsx?|jsx?)$/.test(entry.name)) {
      yield path;
    }
  }
}

async function checkFile(filePath: string): Promise<void> {
  const content = await readFile(filePath, 'utf-8');
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    
    // Check for sync params in dynamic routes
    if (
      (filePath.includes('[') || filePath.includes(']')) &&
      /params[:\s]*{/.test(line) &&
      !/params[:\s]*Promise</.test(line)
    ) {
      issues.push({
        file: filePath,
        line: lineNumber,
        type: 'error',
        category: 'Dynamic Routes',
        message: 'params must be awaited in Next.js 15',
        snippet: line.trim(),
      });
    }
    
    // Check for generateMetadata with sync params
    if (
      /generateMetadata/.test(line) &&
      lines.slice(Math.max(0, index - 2), index + 5).some(l => 
        /params[:\s]*{/.test(l) && !/params[:\s]*Promise</.test(l)
      )
    ) {
      issues.push({
        file: filePath,
        line: lineNumber,
        type: 'error',
        category: 'Metadata',
        message: 'params must be awaited in generateMetadata',
        snippet: line.trim(),
      });
    }
    
    // Check for deprecated crypto import
    if (/^import\s+crypto\s+from\s+['"]crypto['"]/.test(line)) {
      issues.push({
        file: filePath,
        line: lineNumber,
        type: 'warning',
        category: 'Imports',
        message: 'crypto package is deprecated, use node:crypto instead',
        snippet: line.trim(),
      });
    }
    
    // Check for fetch without explicit caching
    if (
      /\bfetch\s*\(/.test(line) &&
      !/cache:|next:/.test(line) &&
      !lines[index - 1]?.includes('cache:') &&
      !lines[index + 1]?.includes('cache:')
    ) {
      issues.push({
        file: filePath,
        line: lineNumber,
        type: 'warning',
        category: 'Caching',
        message: 'fetch() is no longer cached by default in Next.js 15',
        snippet: line.trim(),
      });
    }
    
    // Check for forwardRef usage
    if (/forwardRef/.test(line)) {
      issues.push({
        file: filePath,
        line: lineNumber,
        type: 'info',
        category: 'React 19',
        message: 'Consider simplifying forwardRef to ref as prop in React 19',
        snippet: line.trim(),
      });
    }
    
    // Check for cookies() without await
    if (/cookies\(\)/.test(line) && !/await\s+cookies\(\)/.test(line)) {
      issues.push({
        file: filePath,
        line: lineNumber,
        type: 'error',
        category: 'Async APIs',
        message: 'cookies() must be awaited in Next.js 15',
        snippet: line.trim(),
      });
    }
    
    // Check for headers() without await
    if (/headers\(\)/.test(line) && !/await\s+headers\(\)/.test(line)) {
      issues.push({
        file: filePath,
        line: lineNumber,
        type: 'error',
        category: 'Async APIs',
        message: 'headers() must be awaited in Next.js 15',
        snippet: line.trim(),
      });
    }
  });
}

async function main() {
  console.log('🔍 Scanning codebase for Next.js 15 / React 19 compatibility issues...\n');
  
  const srcDir = join(process.cwd(), 'src');
  
  for await (const file of walkFiles(srcDir)) {
    await checkFile(file);
  }
  
  // Group issues by category
  const byCategory = issues.reduce((acc, issue) => {
    if (!acc[issue.category]) {
      acc[issue.category] = [];
    }
    acc[issue.category].push(issue);
    return acc;
  }, {} as Record<string, Issue[]>);
  
  // Print results
  if (issues.length === 0) {
    console.log('✅ No compatibility issues found!\n');
    console.log('Your codebase appears ready for Next.js 15 and React 19.\n');
    return;
  }
  
  console.log(`Found ${issues.length} potential issue(s):\n`);
  
  // Print by severity
  const errors = issues.filter(i => i.type === 'error');
  const warnings = issues.filter(i => i.type === 'warning');
  const infos = issues.filter(i => i.type === 'info');
  
  if (errors.length > 0) {
    console.log(`\n❌ ERRORS (${errors.length}) - Must fix before upgrading:\n`);
    errors.forEach(issue => {
      console.log(`  ${issue.file}:${issue.line}`);
      console.log(`    ${issue.message}`);
      if (issue.snippet) {
        console.log(`    > ${issue.snippet}`);
      }
      console.log();
    });
  }
  
  if (warnings.length > 0) {
    console.log(`\n⚠️  WARNINGS (${warnings.length}) - Should review:\n`);
    warnings.forEach(issue => {
      console.log(`  ${issue.file}:${issue.line}`);
      console.log(`    ${issue.message}`);
      if (issue.snippet) {
        console.log(`    > ${issue.snippet}`);
      }
      console.log();
    });
  }
  
  if (infos.length > 0) {
    console.log(`\nℹ️  INFO (${infos.length}) - Optional improvements:\n`);
    infos.forEach(issue => {
      console.log(`  ${issue.file}:${issue.line}`);
      console.log(`    ${issue.message}`);
      if (issue.snippet) {
        console.log(`    > ${issue.snippet}`);
      }
      console.log();
    });
  }
  
  // Summary by category
  console.log('\n📊 Summary by category:\n');
  Object.entries(byCategory).forEach(([category, items]) => {
    console.log(`  ${category}: ${items.length} issue(s)`);
  });
  
  console.log('\n📚 See UPGRADE_GUIDE.md for detailed migration instructions.\n');
  
  // Exit with error if there are errors
  if (errors.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Error running compatibility check:', error);
  process.exit(1);
});
