import { execSync } from 'child_process';

const scripts = ['scrape-news', 'scrape-artists', 'scrape-timetable', 'scrape-food'];

for (const script of scripts) {
  console.log(`\n=== Running ${script} ===`);
  try {
    execSync(`npx tsx scripts/${script}.ts`, { stdio: 'inherit' });
  } catch (err) {
    console.error(`[scrape-all] ${script} failed. Continuing...`);
  }
}

console.log('\n=== All done ===');
