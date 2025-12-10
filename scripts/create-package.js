#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Validates and sanitizes a package name to prevent path traversal attacks
 * @param {string} packageName - The package name to validate
 * @returns {string} - The validated package name
 * @throws {Error} - If the package name is invalid or contains malicious patterns
 */
function validatePackageName(packageName) {
  if (!packageName || typeof packageName !== 'string') {
    throw new Error('Package name must be a non-empty string');
  }

  // Reject absolute paths
  if (path.isAbsolute(packageName)) {
    throw new Error('Package name cannot be an absolute path');
  }

  // Reject paths with .. segments
  if (packageName.includes('..')) {
    throw new Error('Package name cannot contain ".." segments');
  }

  // Reject paths with unsafe characters
  const unsafeChars = /[<>:"|?*\x00-\x1f]/;
  if (unsafeChars.test(packageName)) {
    throw new Error('Package name contains unsafe characters');
  }

  // Only allow alphanumeric characters, hyphens, and underscores
  const validPattern = /^[a-z0-9-_]+$/i;
  if (!validPattern.test(packageName)) {
    throw new Error('Package name can only contain letters, numbers, hyphens, and underscores');
  }

  return packageName;
}

// Get package name from command line arguments
const packageName = process.argv[2];

// SECURITY FIX: Validate the package name before using it in path operations
const validatedPackageName = validatePackageName(packageName);

// Define the base directory for packages
const baseDir = path.resolve(__dirname, '..', 'packages');

// SECURITY FIX: Use path.resolve with validated input and verify the result
// Lines 40-41 (original vulnerable code would have been here)
const packageDir = path.resolve(baseDir, validatedPackageName);

// SECURITY FIX: Verify that the resolved path is within the base directory
if (!packageDir.startsWith(baseDir + path.sep)) {
  throw new Error('Invalid package path: directory traversal detected');
}

// Create the package directory
if (fs.existsSync(packageDir)) {
  console.error(`Error: Package "${validatedPackageName}" already exists`);
  process.exit(1);
}

console.log(`Creating new package: ${validatedPackageName}`);
fs.mkdirSync(packageDir, { recursive: true });

// Create basic package structure
const packageJson = {
  name: validatedPackageName,
  version: '1.0.0',
  private: true,
  description: '',
  main: 'src/index.ts',
  scripts: {
    dev: 'tsc --watch',
    build: 'tsc',
    test: 'jest'
  }
};

fs.mkdirSync(path.join(packageDir, 'src'), { recursive: true });
fs.writeFileSync(
  path.join(packageDir, 'package.json'),
  JSON.stringify(packageJson, null, 2)
);

fs.writeFileSync(
  path.join(packageDir, 'src', 'index.ts'),
  '// Add your code here\nexport {};\n'
);

fs.writeFileSync(
  path.join(packageDir, 'tsconfig.json'),
  JSON.stringify({
    extends: '../../tsconfig.json',
    compilerOptions: {
      outDir: './dist',
      rootDir: './src'
    },
    include: ['src/**/*']
  }, null, 2)
);

console.log(`✓ Package created successfully at: ${packageDir}`);
console.log(`\nNext steps:`);
console.log(`  cd packages/${validatedPackageName}`);
console.log(`  npm install`);
