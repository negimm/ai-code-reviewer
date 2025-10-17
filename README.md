# AI Code Reviewer Chrome Extension

## Quick Start Implementation Guide

Follow these steps to implement and test your Chrome extension for the **Google Chrome Built-in AI Challenge 2025**.

### Prerequisites

1. **Chrome Dev/Canary** (Version 127+)
2. **Enable Chrome Flags**:
   - Navigate to `chrome://flags/#prompt-api-for-gemini-nano` → Set to "Enabled"
   - Navigate to `chrome://flags/#optimization-guide-on-device-model` → Set to "Enabled BypassPrefRequirement"
   - Navigate to `chrome://flags/#summarizer-api` → Set to "Enabled"
   - Navigate to `chrome://flags/#writer-api` → Set to "Enabled"  
   - Navigate to `chrome://flags/#rewriter-api` → Set to "Enabled"
   - Navigate to `chrome://flags/#proofreader-api` → Set to "Enabled"

3. **Restart Chrome** and go to `chrome://components` → Find "Optimization Guide On Device Model" → Click "Check for update"

4. **Verify Setup**: Open console and run `await ai.languageModel.capabilities()` - should return "readily"

### Project Structure

Create a new folder called `ai-code-reviewer` and add these files:

```
ai-code-reviewer/
├── manifest.json          # Extension configuration
├── background.js          # Service worker with AI logic
├── content.js            # Code detection and UI injection
├── popup.html            # Extension popup interface  
├── popup.js              # Popup functionality
├── sidepanel.html        # Side panel interface
├── sidepanel.js          # Side panel functionality
├── styles.css            # All styling
└── icons/               # Extension icons (16x16, 32x32, 48x48, 128x128)
```

### Implementation Steps

#### Step 1: Create Basic Extension Structure

1. **Copy all provided code files** into your project folder
2. **Create icons folder** with PNG icons in sizes: 16x16, 32x32, 48x48, 128x128px
3. **Test basic loading**: Go to `chrome://extensions/` → Enable Developer mode → Load unpacked

#### Step 2: Test Core Functionality

1. **Visit GitHub/GitLab** with code files
2. **Look for "AI Review" buttons** next to code blocks  
3. **Click extension icon** to see popup with AI status
4. **Test analysis** by clicking any review button

#### Step 3: Debug Common Issues

**AI Not Available:**
- Check Chrome flags are enabled and Chrome restarted
- Run `chrome://components` and update Gemini Nano model
- Verify `await ai.languageModel.capabilities()` returns "readily"

**Buttons Not Appearing:**
- Check console for JavaScript errors
- Verify content script is loading on supported sites
- Test with different code hosting platforms

**Extension Errors:**
- Check `chrome://extensions/` for error messages
- Review manifest.json permissions
- Test in incognito mode

#### Step 4: Advanced Features

1. **Multimodal Analysis**: Upload code screenshots via side panel
2. **Bulk Review**: Analyze all files in a pull request
3. **Documentation Generation**: Use Writer API for auto-docs
4. **Code Improvement**: Use Rewriter API for suggestions

### Key API Usage Patterns

#### Prompt API (Core Analysis)
```javascript
const session = await self.ai.languageModel.create({
  systemPrompt: "You are an expert code reviewer..."
});
const result = await session.prompt(codeAnalysisPrompt);
```

#### Summarizer API  
```javascript
const summarizer = await self.ai.summarizer.create({
  type: 'key-points',
  format: 'markdown',
  length: 'medium'
});
const summary = await summarizer.summarize(longText);
```

#### Writer API
```javascript
const writer = await self.ai.writer.create({
  tone: 'formal',
  format: 'markdown'
});
const docs = await writer.write(docGenerationPrompt);
```

#### Rewriter API
```javascript  
const rewriter = await self.ai.rewriter.create({
  tone: 'more-formal'
});
const improved = await rewriter.rewrite(originalCode);
```

#### Proofreader API
```javascript
const proofreader = await self.ai.proofreader.create();
const corrected = await proofreader.proofread(generatedText);
```

### Testing Checklist

- [ ] Extension loads without errors
- [ ] All 5 AI APIs show "readily" status in popup
- [ ] Review buttons appear on GitHub/GitLab code
- [ ] Code analysis produces meaningful results
- [ ] Documentation generation works
- [ ] Code improvement suggestions are relevant  
- [ ] Side panel opens and functions
- [ ] Image upload and analysis works (multimodal)
- [ ] Settings persist between sessions
- [ ] Error handling works gracefully

### Submission Requirements

1. **GitHub Repository**: Create public repo with all source code
2. **Demo Video**: 3-minute YouTube video showing all features
3. **Description**: Explain APIs used and problems solved
4. **Working Extension**: Publishable .zip package

### Competitive Edge Features

1. **Multi-API Integration**: Use all 5 Chrome AI APIs together
2. **Platform Support**: Works on GitHub, GitLab, Bitbucket  
3. **Privacy-First**: All processing happens locally
4. **Multimodal**: Analyze code screenshots and diagrams
5. **Comprehensive**: Bug detection, security scan, performance analysis
6. **Professional UI**: Clean, responsive, accessible design

### Prize Category Strategy

**Target: Most Helpful Chrome Extension ($14,000)**
- Focus on solving real developer pain points
- Emphasize productivity improvements  
- Show measurable time savings
- Demonstrate wide applicability

**Alternative: Best Multimodal AI Application ($9,000)**
- Highlight image analysis features
- Show code diagram understanding
- Demonstrate audio input capabilities  
- Focus on innovative use cases

### Troubleshooting

**Model Download Issues:**
```bash
# Check model status
chrome://on-device-internals

# Force model download
await ai.languageModel.create()
```

**Permission Errors:**
- Verify host_permissions in manifest.json
- Check content script matches in manifest
- Test on different domains

**Performance Issues:**
- Implement proper session management
- Use streaming for long responses  
- Add loading states and progress indicators
- Optimize for mobile/low-power devices

### Next Steps

1. **Implement core files** using provided code
2. **Test on live sites** (GitHub, GitLab)
3. **Add custom features** to differentiate your extension  
4. **Create compelling demo** showcasing all capabilities
5. **Submit before October 31, 2025** deadline

This extension leverages cutting-edge browser AI to provide instant, privacy-preserving code review capabilities that work seamlessly across major code hosting platforms. The multi-API approach ensures comprehensive analysis while the local processing guarantees user privacy and offline functionality.