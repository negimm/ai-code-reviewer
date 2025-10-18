// utils/ai-manager.js - With increased timeouts and simpler prompts

export class AIManager {
  constructor() {
    this.session = null;
    this.operationTimeout = 300000; // 5 minutes (increased from 3)
    this.defaultLanguage = 'en';
  }

  async withTimeout(promise, timeoutMs = this.operationTimeout) {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs/1000}s`)), timeoutMs)
      )
    ]);
  }

  async checkCapabilities() {
    const capabilities = {
      prompt: false,
      promptStatus: 'checking',
      apiFound: false
    };

    try {
      if (typeof LanguageModel !== 'undefined') {
        capabilities.apiFound = true;
        
        try {
          // Quick availability check
          const testSession = await this.withTimeout(
            LanguageModel.create({
              expectedInputs: [{ type: 'text', languages: ['en'] }],
              expectedOutputs: [{ type: 'text', languages: ['en'] }]
            }),
            30000 // 30 second timeout for capability check
          );
          
          capabilities.prompt = true;
          capabilities.promptStatus = 'readily';
          console.log('✅ LanguageModel API Status: readily available');
          
          testSession.destroy();
          
        } catch (error) {
          console.error('LanguageModel check failed:', error);
          capabilities.promptStatus = 'error';
        }
      } else {
        console.error('❌ LanguageModel API not found');
        capabilities.promptStatus = 'not-found';
      }

      return capabilities;
    } catch (error) {
      console.error('❌ Capability check error:', error);
      return capabilities;
    }
  }

  async createSession() {
    try {
      if (this.session) {
        try {
          this.session.destroy();
        } catch (e) {}
        this.session = null;
      }

      console.log('Creating LanguageModel session...');

      this.session = await this.withTimeout(
        LanguageModel.create({
          systemPrompt: 'You are a code reviewer. Provide brief, clear feedback.',
          temperature: 0.7, // Lower temperature for more focused responses
          topK: 3,
          expectedInputs: [{ type: 'text', languages: ['en'] }],
          expectedOutputs: [{ type: 'text', languages: ['en'] }]
        }),
        60000 // 1 minute for session creation
      );

      console.log('✅ Session created successfully!');
      return this.session;
      
    } catch (error) {
      console.error('❌ Session creation failed:', error);
      this.session = null;
      throw new Error(`Failed to create session: ${error.message}`);
    }
  }

  async reviewCode(code, options = {}) {
    const maxRetries = 1; // Reduce to 1 retry to save time
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔍 Review attempt ${attempt + 1}/${maxRetries + 1}`);
        
        if (!this.session) {
          await this.createSession();
        }
        
        // MUCH SIMPLER PROMPT - less tokens, faster processing
        const reviewPrompt = `Review this code briefly:

\`\`\`
${code.substring(0, 2000)}
\`\`\`

List 3 key improvements.`;

        console.log('📤 Sending prompt... (may take 1-3 minutes)');
        
        // INCREASED TIMEOUT: 5 minutes
        const result = await this.withTimeout(
          this.session.prompt(reviewPrompt),
          300000 // 5 minutes
        );

        console.log('✅ Review completed!');
        
        return {
          raw: result,
          timestamp: new Date().toISOString(),
          attempts: attempt + 1
        };
        
      } catch (error) {
        lastError = error;
        console.warn(`❌ Attempt ${attempt + 1} failed:`, error.message);

        if (this.session) {
          try {
            this.session.destroy();
          } catch (e) {}
          this.session = null;
        }

        if (attempt < maxRetries) {
          console.log(`⏳ Retrying in 3 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
    }

    throw new Error(`Review failed: ${lastError.message}. Try with shorter code.`);
  }

  async generateDocumentation(code, options = {}) {
    try {
      if (!this.session) {
        await this.createSession();
      }
      
      // Simpler doc prompt
      const docPrompt = `Document this code:

\`\`\`
${code.substring(0, 2000)}
\`\`\`

Include main purpose and key functions.`;

      console.log('📝 Generating documentation...');
      const result = await this.withTimeout(
        this.session.prompt(docPrompt),
        300000
      );

      return result;
      
    } catch (error) {
      console.error('❌ Documentation failed:', error);
      throw error;
    }
  }

  async refactorCode(code, options = {}) {
    try {
      if (!this.session) {
        await this.createSession();
      }
      
      // Simpler refactor prompt
      const refactorPrompt = `Suggest 3 improvements for this code:

\`\`\`
${code.substring(0, 2000)}
\`\`\``;

      console.log('🔧 Refactoring...');
      const result = await this.withTimeout(
        this.session.prompt(refactorPrompt),
        300000
      );

      return result;
      
    } catch (error) {
      console.error('❌ Refactoring failed:', error);
      throw error;
    }
  }

  cleanup() {
    if (this.session) {
      try {
        this.session.destroy();
      } catch (e) {}
      this.session = null;
    }
  }
}
