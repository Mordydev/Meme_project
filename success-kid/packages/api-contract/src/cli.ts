#!/usr/bin/env node
/**
 * API Contract CLI
 * 
 * Command-line interface for API contract verification and generation.
 */
import { Command } from 'commander';
import chalk from 'chalk';
import * as path from 'path';
import {
  loadApiContract,
  verifyApiContract,
  formatVerificationResult,
  extractBackendContract,
  extractFrontendUsage
} from './verification';
import { generateTypeInterfaces, generateApiClient } from './generator';
import { VerificationOptions, GeneratorOptions } from './types';

// Create command-line program
const program = new Command();

// Setup program metadata
program
  .name('api-contract')
  .description('API contract verification and generation tools')
  .version('0.1.0');

// Define commands
program
  .command('verify')
  .description('Verify API contract consistency')
  .option('-c, --contract <path>', 'Path to API contract file or directory', 'api-contract')
  .option('-b, --backend <path>', 'Path to backend source code for extraction', 'apps/backend')
  .option('-f, --frontend <path>', 'Path to frontend source code for extraction', 'apps/frontend')
  .option('-i, --ignore-deprecated', 'Ignore deprecated endpoints', false)
  .option('-v, --verbose', 'Show verbose output', false)
  .option('--check-frontend', 'Check frontend implementation against contract', false)
  .option('--check-backend', 'Check backend implementation against contract', false)
  .action(async (options) => {
    try {
      console.log(chalk.blue('Loading API contract...'));
      
      // Resolve paths relative to current directory
      const contractPath = path.resolve(process.cwd(), options.contract);
      const backendPath = path.resolve(process.cwd(), options.backend);
      const frontendPath = path.resolve(process.cwd(), options.frontend);
      
      // Load the API contract
      const contract = await loadApiContract(contractPath);
      
      console.log(chalk.green(`Loaded ${contract.endpoints.length} endpoints from contract`));
      
      // Verify the contract
      const verificationOptions: VerificationOptions = {
        ignoreDeprecated: options.ignoreDeprecated,
        verbose: options.verbose,
        checkFrontendImplementation: options.checkFrontend,
        checkBackendImplementation: options.checkBackend
      };
      
      const result = verifyApiContract(contract, verificationOptions);
      
      // Check backend implementation if enabled
      if (options.checkBackend) {
        console.log(chalk.blue('Checking backend implementation...'));
        
        const backendContract = await extractBackendContract(backendPath);
        
        console.log(chalk.green(`Extracted ${backendContract.endpoints.length} endpoints from backend code`));
        
        // TODO: Compare backend contract with defined contract
      }
      
      // Check frontend implementation if enabled
      if (options.checkFrontend) {
        console.log(chalk.blue('Checking frontend implementation...'));
        
        const frontendUsage = await extractFrontendUsage(frontendPath);
        
        // TODO: Compare frontend usage with defined contract
      }
      
      // Display verification result
      const formattedResult = formatVerificationResult(result, verificationOptions);
      console.log(formattedResult);
      
      // Exit with appropriate code
      process.exit(result.valid ? 0 : 1);
    } catch (error) {
      console.error(chalk.red('Error verifying API contract:'), error);
      process.exit(1);
    }
  });

program
  .command('generate')
  .description('Generate code from API contract')
  .option('-c, --contract <path>', 'Path to API contract file or directory', 'api-contract')
  .option('-o, --output <path>', 'Output directory', 'generated')
  .option('-i, --include-deprecated', 'Include deprecated endpoints', false)
  .option('-f, --format <format>', 'Output format (ts, js, json)', 'ts')
  .option('--clients', 'Generate API clients', true)
  .option('--interfaces', 'Generate type interfaces', true)
  .action(async (options) => {
    try {
      console.log(chalk.blue('Loading API contract...'));
      
      // Resolve paths relative to current directory
      const contractPath = path.resolve(process.cwd(), options.contract);
      const outputPath = path.resolve(process.cwd(), options.output);
      
      // Load the API contract
      const contract = await loadApiContract(contractPath);
      
      console.log(chalk.green(`Loaded ${contract.endpoints.length} endpoints from contract`));
      
      // Set up generator options
      const generatorOptions: GeneratorOptions = {
        outputDir: outputPath,
        includeDeprecated: options.includeDeprecated,
        format: options.format as any,
        generateClients: options.clients
      };
      
      // Generate type interfaces if enabled
      if (options.interfaces) {
        console.log(chalk.blue('Generating type interfaces...'));
        await generateTypeInterfaces(contract, generatorOptions);
      }
      
      // Generate API clients if enabled
      if (options.clients) {
        console.log(chalk.blue('Generating API clients...'));
        await generateApiClient(contract, generatorOptions);
      }
      
      console.log(chalk.green('Code generation complete!'));
    } catch (error) {
      console.error(chalk.red('Error generating code:'), error);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();
