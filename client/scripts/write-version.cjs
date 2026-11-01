const { execFileSync } = require('node:child_process');
const { writeFileSync } = require('node:fs');
const commit = process.env.GITHUB_SHA || execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
writeFileSync('dist/version.json', JSON.stringify({ commit, builtAt: new Date().toISOString() }));
