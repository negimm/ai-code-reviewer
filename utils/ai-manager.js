// utils/ai-manager.js - Enhanced with all Chrome Built-in AI APIs

export class AIManager {
  constructor() {
    this.sessions = {
      prompt: null,
      writer: null,
      rewriter: null,
      summarizer: null
    };
    this.translatorSessions = new Map();
    this.operationTimeout = 180000; // 3 minutes
    this.initializationPromises = new Map();
  }

  async withTimeout(promise, timeoutMs = this.operationTimeout) {
    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
      )
    ]);
  }

  async checkCapabilities() {
    const capabilities = {
      prompt: false,
      writer: false,
      rewriter: false,
      summarizer: false,
      translator: false,
      apiFound: false
    };

    try {
      // Check LanguageModel (Prompt API)
      if (typeof LanguageModel !== 'undefined') {
        capabilities.apiFound = true;
        try {
          const availability = await this.withTimeout(
            LanguageModel.availability(),
            10000
          );
          capabilities.prompt = availability !== 'unavailable';
          capabilities.promptStatus = availability;
        } catch (error) {
          console.warn('LanguageModel check failed:', error);
        }
      }

      // Check Writer API
      if (typeof AIWriter !== 'undefined') {
        try {
          const availability = await this.withTimeout(
            AIWriter.availability(),
            10000
          );
          capabilities.writer = availability !== 'unavailable';
          capabilities.writerStatus = availability;
        } catch (error) {
          console.warn('AIWriter check failed:', error);
        }
      }

      // Check Rewriter API
      if (typeof AIRewriter !== 'undefined') {
        try {
          const availability = await this.withTimeout(
            AIRewriter.availability(),
            10000
          );
          capabilities.rewriter = availability !== 'unavailable';
          capabilities.rewriterStatus = availability;
        } catch (error) {
          console.warn('AIRewriter check failed:', error);
        }
      }

      // Check Summarizer API
      if (typeof AISummarizer !== 'undefined') {
        try {
          const availability = await this.withTimeout(
            AISummarizer.availability(),
            10000
          );
          capabilities.summarizer = availability !== 'unavailable';
          capabilities.summarizerStatus = availability;
        } catch (error) {
          console.warn('AISummarizer check failed:', error);
        }
      }

      // Check Translator API
      if (typeof AITranslator !== 'undefined') {
        try {
          const availability = await this.withTimeout(
            AITranslator.availability({ sourceLanguage: 'en', targetLanguage: 'es' }),
            10000
          );
          capabilities.translator = availability !== 'unavailable';
          capabilities.translatorStatus = availability;
        } catch (error) {
          console.warn('AITranslator check failed:', error);
        }
      }

      console.log('✅ Capabilities check complete:', capabilities);
      return capabilities;
    } catch (error) {
      console.error('❌ Capability check error:', error);
      return capabilities;
    }
  }

  // Prompt API - Enhanced with retry logic
  async initPromptSession(options = {}) {
    if (this.initializationPromises.has('prompt')) {
      return this.initializationPromises.get('prompt');
    }

    if (this.sessions.prompt) return this.sessions.prompt;

    const initPromise = this._createPromptSession(options);
    this.initializationPromises.set('prompt', initPromise);

    try {
      this.sessions.prompt = await initPromise;
      return this.sessions.prompt;
    } finally {
      this.initializationPromises.delete('prompt');
    }
  }

  async _createPromptSession(options) {
    try {
      if (typeof LanguageModel === 'undefined') {
        throw new Error('LanguageModel API not available');
      }

      const availability = await this.withTimeout(
        LanguageModel.availability(),
        10000
      );

      if (availability === 'unavailable') {
        throw new Error('Prompt API unavailable');
      }

      const session = await this.withTimeout(
        LanguageModel.create({
          temperature: options.temperature || 0.7,
          topK: options.topK || 3,
          systemPrompt: options.systemPrompt || 'You are an expert code reviewer focused on code quality, security, and best practices.'
        }),
        60000
      );

      console.log('✅ Prompt API session created!');
      return session;
    } catch (error) {
      throw new Error(`Prompt API initialization failed: ${error.message}`);
    }
  }

  async reviewCode(code, options = {}) {
    const maxRetries = 2;
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const session = await this.initPromptSession();
        
        const reviewPrompt = `Review this ${options.language || 'code'} for:
1. Code quality and best practices
2. Potential bugs and security issues
3. Performance improvements
4. Readability and maintainability

Code:
\`\`\`
${code}
\`\`\`

Provide a structured review with specific recommendations.`;

        const result = await this.withTimeout(
          session.prompt(reviewPrompt),
          120000
        );

        return {
          raw: result,
          timestamp: new Date().toISOString(),
          attempts: attempt + 1
        };
      } catch (error) {
        lastError = error;
        console.warn(`Review attempt ${attempt + 1} failed:`, error);

        // Clean up failed session
        if (this.sessions.prompt) {
          try {
            this.sessions.prompt.destroy();
          } catch (e) {
            console.warn('Session cleanup error:', e);
          }
          this.sessions.prompt = null;
        }

        if (attempt === maxRetries) break;
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }

    throw new Error(`Review failed after ${maxRetries + 1} attempts: ${lastError.message}`);
  }

  // Writer API - Enhanced
  async initWriterSession(options = {}) {
    if (this.initializationPromises.has('writer')) {
      return this.initializationPromises.get('writer');
    }

    if (this.sessions.writer) return this.sessions.writer;

    const initPromise = this._createWriterSession(options);
    this.initializationPromises.set('writer', initPromise);

    try {
      this.sessions.writer = await initPromise;
      return this.sessions.writer;
    } finally {
      this.initializationPromises.delete('writer');
    }
  }

  async _createWriterSession(options) {
    try {
      if (typeof AIWriter === 'undefined') {
        throw new Error('AIWriter API not available');
      }

      const availability = await this.withTimeout(
        AIWriter.availability(),
        10000
      );

      if (availability === 'unavailable') {
        throw new Error('Writer API unavailable');
      }

      const session = await this.withTimeout(
        AIWriter.create({
          tone: options.tone || 'formal',
          format: options.format || 'markdown',
          length: options.length || 'medium'
        }),
        60000
      );

      console.log('✅ Writer API session created!');
      return session;
    } catch (error) {
      throw new Error(`Writer API initialization failed: ${error.message}`);
    }
  }

  async generateDocumentation(code, options = {}) {
    try {
      const writer = await this.initWriterSession(options);
      
      const docPrompt = `Generate comprehensive documentation for this code including:
- Function/class descriptions
- Parameters and return values
- Usage examples
- Important notes

Code:
\`\`\`
${code}
\`\`\``;

      const result = await this.withTimeout(
        writer.write(docPrompt),
        120000
      );

      return result;
    } catch (error) {
      console.error('❌ Documentation generation failed:', error);
      throw error;
    }
  }

  // Rewriter API - Enhanced
  async initRewriterSession(options = {}) {
    if (this.initializationPromises.has('rewriter')) {
      return this.initializationPromises.get('rewriter');
    }

    if (this.sessions.rewriter) return this.sessions.rewriter;

    const initPromise = this._createRewriterSession(options);
    this.initializationPromises.set('rewriter', initPromise);

    try {
      this.sessions.rewriter = await initPromise;
      return this.sessions.rewriter;
    } finally {
      this.initializationPromises.delete('rewriter');
    }
  }

  async _createRewriterSession(options) {
    try {
      if (typeof AIRewriter === 'undefined') {
        throw new Error('AIRewriter API not available');
      }

      const availability = await this.withTimeout(
        AIRewriter.availability(),
        10000
      );

      if (availability === 'unavailable') {
        throw new Error('Rewriter API unavailable');
      }

      const session = await this.withTimeout(
        AIRewriter.create({
          tone: options.tone || 'as-is',
          format: options.format || 'as-is',
          length: options.length || 'as-is'
        }),
        60000
      );

      console.log('✅ Rewriter API session created!');
      return session;
    } catch (error) {
      throw new Error(`Rewriter API initialization failed: ${error.message}`);
    }
  }

  async refactorCode(code, options = {}) {
    try {
      const rewriter = await this.initRewriterSession(options);
      
      const refactorContext = `Refactor this code to improve:
- Code readability and structure
- Performance and efficiency
- Following best practices
- Removing code smells

Original code:
\`\`\`
${code}
\`\`\``;

      const result = await this.withTimeout(
        rewriter.rewrite(refactorContext),
        120000
      );

      return result;
    } catch (error) {
      console.error('❌ Refactoring failed:', error);
      throw error;
    }
  }

  // NEW: Summarizer API
  async initSummarizerSession() {
    if (this.initializationPromises.has('summarizer')) {
      return this.initializationPromises.get('summarizer');
    }

    if (this.sessions.summarizer) return this.sessions.summarizer;

    const initPromise = this._createSummarizerSession();
    this.initializationPromises.set('summarizer', initPromise);

    try {
      this.sessions.summarizer = await initPromise;
      return this.sessions.summarizer;
    } finally {
      this.initializationPromises.delete('summarizer');
    }
  }

  async _createSummarizerSession() {
    try {
      if (typeof AISummarizer === 'undefined') {
        throw new Error('Summarizer API not available');
      }

      const availability = await this.withTimeout(
        AISummarizer.availability(),
        10000
      );

      if (availability === 'unavailable') {
        throw new Error('Summarizer API unavailable');
      }

      const session = await this.withTimeout(
        AISummarizer.create({
          type: 'tl;dr',
          format: 'markdown',
          length: 'medium'
        }),
        60000
      );

      console.log('✅ Summarizer API session created!');
      return session;
    } catch (error) {
      throw new Error(`Summarizer API initialization failed: ${error.message}`);
    }
  }

  async summarizePR(prContent, options = {}) {
    try {
      const summarizer = await this.initSummarizerSession();
      const result = await this.withTimeout(
        summarizer.summarize(prContent),
        60000
      );
      return result;
    } catch (error) {
      console.error('❌ Summarization failed:', error);
      throw error;
    }
  }

  // NEW: Translator API
  async initTranslatorSession(sourceLanguage, targetLanguage) {
    const key = `${sourceLanguage}-${targetLanguage}`;
    
    if (this.translatorSessions.has(key)) {
      return this.translatorSessions.get(key);
    }

    try {
      if (typeof AITranslator === 'undefined') {
        throw new Error('Translator API not available');
      }

      const availability = await this.withTimeout(
        AITranslator.availability({ sourceLanguage, targetLanguage }),
        10000
      );

      if (availability === 'unavailable') {
        throw new Error(`Translation ${sourceLanguage} → ${targetLanguage} unavailable`);
      }

      const translator = await this.withTimeout(
        AITranslator.create({ sourceLanguage, targetLanguage }),
        30000
      );

      this.translatorSessions.set(key, translator);
      console.log(`✅ Translator session created: ${sourceLanguage} → ${targetLanguage}`);
      return translator;
    } catch (error) {
      throw new Error(`Translator API initialization failed: ${error.message}`);
    }
  }

  async translateComment(text, targetLanguage, sourceLanguage = 'en') {
    try {
      const translator = await this.initTranslatorSession(sourceLanguage, targetLanguage);
      return await this.withTimeout(
        translator.translate(text),
        30000
      );
    } catch (error) {
      console.error('❌ Translation failed:', error);
      throw error;
    }
  }

  // Cleanup method
  cleanup() {
    console.log('🧹 Cleaning up AI sessions...');
    
    if (this.sessions.prompt) {
      try { this.sessions.prompt.destroy(); } catch (e) {}
      this.sessions.prompt = null;
    }
    
    if (this.sessions.writer) {
      try { this.sessions.writer.destroy(); } catch (e) {}
      this.sessions.writer = null;
    }
    
    if (this.sessions.rewriter) {
      try { this.sessions.rewriter.destroy(); } catch (e) {}
      this.sessions.rewriter = null;
    }
    
    if (this.sessions.summarizer) {
      try { this.sessions.summarizer.destroy(); } catch (e) {}
      this.sessions.summarizer = null;
    }

    this.translatorSessions.forEach(translator => {
      try { translator.destroy(); } catch (e) {}
    });
    this.translatorSessions.clear();
    
    this.initializationPromises.clear();
  }
}
