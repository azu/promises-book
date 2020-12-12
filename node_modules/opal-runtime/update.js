const fs = require('fs');
const path = require('path');
const execSync = require('child_process').execSync;

const opalDirectory = path.resolve('../opal');
const args = process.argv.slice(2);
const opalSha1 = args[0];

if (process.env.SKIP_BUILD) {
  // Skip build
  console.log('SKIP_BUILD environment variable is true, skipping "build" task');
} else {
  if (!opalSha1) {
    console.error('Please specify a sha1/tag to build Opal');
    process.exit(9);
  }
  console.log(`Building ${opalDirectory}@${opalSha1}`);
  execSync(`git checkout ${opalSha1}`, {cwd: opalDirectory});
  execSync(`bundle exec rake dist`, {cwd: opalDirectory});
}

// copy
const files = ['base64.js', 'nodejs.js', 'opal.js', 'pathname.js', 'stringio.js', 'open-uri.js'];
files.forEach((file) => {
  console.log(`Copy ${opalDirectory}/build/${file} to src/${file}`);
  fs.createReadStream(`${opalDirectory}/build/${file}`)
    .pipe(fs.createWriteStream(`src/${file}`))
});
