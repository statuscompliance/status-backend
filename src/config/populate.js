import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);
const populatorsDir = path.join(process.cwd(), 'populators');

// Read and execute populators sequentially
async function runPopulators() {
  try {
    const files = await fs.promises.readdir(populatorsDir);
    
    // Filter JavaScript files
    const jsFiles = files.filter(file => file.endsWith('.js'));
    
    if (jsFiles.length === 0) {
      console.log('No populator files found.');
      return;
    }

    // Execute each file sequentially
    for (const file of jsFiles) {
      const filePath = path.join(populatorsDir, file);
      console.log(`Executing populator: ${file}...`);
      
      try {
        // Use --unhandled-rejections=strict to ensure promises are properly handled
        const { stdout, stderr } = await execPromise(`node --unhandled-rejections=strict ${filePath}`);
        
        if (stderr) {
          console.error(`Warning in ${file}: ${stderr}`);
        }
        
        console.log(`Populator ${file} completed:`);
        console.log(stdout);
      } catch (error) {
        console.error(`Error executing populator ${file}: ${error.message}`);
      }
    }
    
    console.log('All populators execution completed.');
  } catch (err) {
    console.error(`Error reading populators directory: ${err.message}`);
  } finally {
    // Ensure the process exits after execution is complete
    process.exit(0);
  }
}

runPopulators();