# 🤖 AI Code Reviewer - Chrome Extension

> **Built-in AI Chrome Extension for GitHub Code Review**  
> Uses Google's Gemini Nano for private, offline code analysis

[![Chrome Built-in AI Challenge 2025](https://img.shields.io/badge/Chrome%20AI%20Challenge-2025-blue)](https://googlechromeai2025.devpost.com)
[![Chrome Version](https://img.shields.io/badge/Chrome-138%2B-green)](https://www.google.com/chrome/dev/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

## 💡 Motivation

As a technical architect leading code reviews for my team, I faced a critical challenge: **balancing code quality with data security**.

### The Problem

Modern organizations heavily restrict LLM tools like ChatGPT, Claude, and GitHub Copilot due to valid security concerns:

- ❌ **Data Leakage Risk**: Developers might accidentally paste proprietary code into cloud-based LLMs
- ❌ **Compliance Issues**: Enterprise policies prohibit sending code to external APIs
- ❌ **Limited Access**: Many teams can't use AI assistance for code reviews
- ❌ **Manual Reviews**: Time-consuming, inconsistent, and dependent on reviewer availability

### The Solution

This extension leverages **Chrome's Built-in AI (Gemini Nano)** to provide:

- ✅ **100% Local Processing**: No data ever leaves your machine
- ✅ **Zero API Calls**: No internet required after initial setup
- ✅ **Enterprise-Safe**: Meets strict corporate security policies
- ✅ **Instant Feedback**: Review code anytime, anywhere, offline
- ✅ **Privacy-First**: Your proprietary code stays private

### Real-World Impact

**Before**: Team waits hours/days for senior developers to review code  
**After**: Instant AI-powered feedback while maintaining complete privacy

This tool enables developers in security-conscious organizations to leverage AI without compromising on data protection—solving a real problem I face daily in my role.

## ✨ Features

- **🔍 Code Review** - AI-powered code quality analysis
- **📝 Documentation Generation** - Auto-generate function docs
- **🔧 Code Refactoring** - Get improvement suggestions
- **🎯 GitHub Integration** - Select code → Instant review
- **🔒 Privacy-First** - All processing happens locally on your device
- **⚡ Real-time** - No API calls, no rate limits, no data transmission
- **🏢 Enterprise-Safe** - Compliant with strict corporate policies

## 🎯 Use Cases

### For Individual Developers
- Quick code quality checks before committing
- Learn best practices from AI suggestions
- Generate documentation faster
- Refactor legacy code with confidence

### For Teams
- **Security Teams**: No data leaves the organization
- **Compliance Officers**: Meets data protection requirements
- **Engineering Managers**: Enable AI assistance without policy violations
- **Code Reviewers**: Pre-screen code before manual review

### For Organizations
- Maintain security while enabling AI productivity
- Reduce dependency on senior developers for basic reviews
- Standardize code quality checks across teams
- Support developers in air-gapped environments

## 📋 Prerequisites

### System Requirements

- **OS**: Windows 10+, macOS 13+, or Linux (desktop only)
- **RAM**: 4GB+ recommended
- **Disk Space**: 22GB free (for Gemini Nano model)
- **GPU/VRAM**: 4GB+ recommended for optimal performance

### Chrome Setup

1. **Install Chrome Dev** (Version 138+)
   - Download: [Chrome Dev Channel](https://www.google.com/chrome/dev/)
   - Current stable (127+) also works

2. **Enable Required Flags**

   Navigate to `chrome://flags` and enable these:

   ```
   #prompt-api-for-gemini-nano → Enabled
   #optimization-guide-on-device-model → Enabled BypassPerfRequirement
   ```

   Optional (for additional features):
   ```
   #writer-api-for-gemini-nano → Enabled
   #rewriter-api-for-gemini-nano → Enabled
   ```

3. **Restart Chrome**

4. **Verify Model Download**

   Go to `chrome://on-device-internals` and check:
   - **Gemini Nano** status should be "Available" or "Ready"
   - If "Not Available", trigger download with:

   ```javascript
   // In DevTools Console
   await LanguageModel.create({
     expectedInputs: [{ type: 'text', languages: ['en'] }],
     expectedOutputs: [{ type: 'text', languages: ['en'] }]
   });
   ```

5. **Test API Availability**

   Open DevTools Console and run:
   ```javascript
   await LanguageModel.availability();
   // Should return: "readily" or "available"
   ```

## 📁 Project Structure

```
ai-code-reviewer/
├── manifest.json              # Extension configuration
├── background.js              # Service worker (opens sidepanel)
├── sidepanel.html            # Main UI
├── sidepanel.js              # Main logic + AI processing
├── content.js                # GitHub code selection handler
├── content.css               # GitHub UI styling
├── utils/
│   ├── ai-manager.js         # LanguageModel API wrapper
│   └── ui-utils.js           # UI helper functions
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## 🚀 Installation

### Development Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/ai-code-reviewer.git
   cd ai-code-reviewer
   ```

2. **Load in Chrome**
   - Open `chrome://extensions/`
   - Enable **Developer mode** (top right)
   - Click **Load unpacked**
   - Select the `ai-code-reviewer` folder

3. **Verify Installation**
   - Click the extension icon
   - Side panel should open
   - Status indicators should show API availability

## 💻 Usage

### Quick Start

1. **Visit GitHub** and navigate to any code file
2. **Select code** (20+ characters)
3. **Side panel opens automatically** with selected code loaded
4. **Click "Review Code"** to analyze

### Manual Review

1. Click extension icon to open side panel
2. Paste code in the input textarea
3. Click one of the action buttons:
   - **🔍 Review Code** - Get quality analysis
   - **📝 Generate Docs** - Create documentation
   - **🔧 Refactor Code** - Get improvement suggestions

## 🔧 Configuration

### Supported Languages

Currently supports output in:
- English (`en`)
- Spanish (`es`)
- Japanese (`ja`)

### Timeout Settings

Default: 5 minutes per operation  
Modify in `utils/ai-manager.js`:
```javascript
this.operationTimeout = 300000; // milliseconds
```

## 🏗️ Architecture

### Technology Stack

- **Chrome Built-in AI APIs**: LanguageModel API (Gemini Nano)
- **Manifest V3**: Modern Chrome extension format
- **Vanilla JavaScript**: No frameworks, pure ES6+
- **Chrome Side Panel API**: Persistent UI

### Data Flow

```
User selects code → content.js captures selection
                  ↓
      Stores in chrome.storage.local
                  ↓
    Side panel opens automatically
                  ↓
     sidepanel.js loads code from storage
                  ↓
   AIManager creates LanguageModel session
                  ↓
        Sends prompt to Gemini Nano (LOCAL)
                  ↓
     Results displayed in side panel
                  ↓
         NO DATA LEAVES YOUR DEVICE
```

### Privacy Architecture

```
┌─────────────────────────────────────────┐
│           Your Computer                  │
│                                          │
│  ┌────────────┐      ┌──────────────┐  │
│  │  Browser   │ ───▶ │ Gemini Nano  │  │
│  │  Extension │ ◀─── │   (Local)    │  │
│  └────────────┘      └──────────────┘  │
│                                          │
│  ✅ All processing happens here          │
│  ✅ No network requests                  │
│  ✅ No data transmission                 │
└─────────────────────────────────────────┘
        ❌ No connection to cloud
```

### API Usage

#### Core Code Review

```javascript
// ai-manager.js
const session = await LanguageModel.create({
  systemPrompt: 'You are an expert code reviewer.',
  temperature: 0.7,
  topK: 3,
  expectedInputs: [{ type: 'text', languages: ['en'] }],
  expectedOutputs: [{ type: 'text', languages: ['en'] }]
});

const result = await session.prompt(reviewPrompt);
```

#### Language Specification (Required)

```javascript
// CRITICAL: Must specify input/output languages
expectedInputs: [{ type: 'text', languages: ['en'] }],
expectedOutputs: [{ type: 'text', languages: ['en'] }]
```

## 🔒 Security & Privacy

### Data Security Guarantees

- **No External APIs**: Zero network calls to any service
- **Local Processing**: All AI inference happens on your device
- **No Data Collection**: Extension doesn't track or store usage
- **No Analytics**: No telemetry or user behavior tracking
- **Open Source**: Full code transparency for security audits

### Enterprise Compliance

This extension is designed to meet enterprise security requirements:

- ✅ **Air-Gapped Compatible**: Works without internet (after setup)
- ✅ **GDPR Compliant**: No personal data processing or transfer
- ✅ **SOC 2 Compatible**: No data leaves the organization
- ✅ **Zero Trust Architecture**: Doesn't require external trust
- ✅ **Audit-Friendly**: All operations logged locally

### Recommended for

- Financial institutions
- Healthcare organizations (HIPAA environments)
- Government contractors
- Defense/Military contractors
- Any organization with strict data policies

## 🐛 Troubleshooting

### AI API Not Available

**Symptom**: Status shows "Unavailable" (red dots)

**Solutions**:
1. Verify Chrome version: `chrome://version` (need 138+)
2. Check flags: `chrome://flags` (ensure enabled and restarted)
3. Check model: `chrome://on-device-internals` (should show "Ready")
4. Run test in DevTools: `await LanguageModel.availability()`

### Operation Timeout

**Symptom**: "Operation timed out after 300s"

**Solutions**:
1. First run takes longer (model initialization)
2. Reduce code size (keep under 2000 characters)
3. Simplify prompts
4. Increase timeout in `ai-manager.js`

### No Output Language Warning

**Symptom**: Warning about language specification

**Solution**: This is normal, already handled in code. If persists, verify `ai-manager.js` includes:
```javascript
expectedOutputs: [{ type: 'text', languages: ['en'] }]
```

### Extension Context Invalidated

**Symptom**: Error after reloading extension

**Solution**: 
1. Close side panel
2. Reload extension
3. Wait 2 seconds
4. Reopen side panel

## 📊 Testing Checklist

- [ ] Extension loads without errors
- [ ] Status indicators show green (Prompt API available)
- [ ] Code selection auto-opens side panel
- [ ] Review Code produces meaningful analysis
- [ ] Documentation generation works
- [ ] Refactoring suggestions are relevant
- [ ] Works on GitHub
- [ ] Copy to clipboard functions
- [ ] Character counter updates
- [ ] Tab switching works

## 🎯 Known Limitations

1. **Model Download**: First-time setup requires 1.5GB download (5-30 minutes)
2. **Processing Time**: Reviews can take 2-5 minutes on first run
3. **Language Support**: Output limited to English, Spanish, Japanese
4. **Platform Support**: Desktop only (no mobile)
5. **Code Length**: Best results with <2000 characters
6. **Chrome Required**: Only works in Chrome/Chromium browsers

## 🔮 Future Enhancements

### Short-term
- [ ] Streaming responses for faster feedback
- [ ] Custom prompt templates
- [ ] Review history storage
- [ ] Performance metrics dashboard

### Long-term
- [ ] GitLab and Bitbucket support
- [ ] Multi-file analysis
- [ ] Code diff comparisons
- [ ] Team collaboration features
- [ ] Custom rule sets
- [ ] IDE integration (VS Code)

## 🤝 Contributing

Contributions welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file.

## 🏆 Chrome Built-in AI Challenge 2025

This extension is submitted to the **Google Chrome Built-in AI Challenge 2025**.

**Target Category**: Most Helpful Chrome Extension ($14,000)

### Why This Extension Stands Out

1. **Solves Real Enterprise Pain**: Addresses actual security concerns in organizations
2. **Privacy-First**: True offline AI, no data transmission
3. **Production-Ready**: Built with 18+ years of software architecture experience
4. **Practical Use Case**: Daily use by development teams
5. **Security-Conscious**: Designed for regulated industries
6. **Seamless Integration**: Works directly in GitHub workflow

### Impact Statement

This extension enables thousands of developers in security-conscious organizations to leverage AI assistance without compromising on data protection—bridging the gap between productivity and security compliance.

## 👤 Author

**Technical Architect with 18+ years experience**
- **Role**: Leading code reviews for enterprise development teams
- **Background**: Java Development, Machine Learning, System Architecture
- **GitHub**: [@yourusername](https://github.com/yourusername)
- **LinkedIn**: [Your LinkedIn](https://linkedin.com/in/yourprofile)

## 🙏 Acknowledgments

- Google Chrome Team for developing Built-in AI APIs
- GitHub for their excellent platform and documentation
- My development team for inspiring this solution
- Chrome DevTools team for excellent debugging tools

## 📚 Resources

- [Chrome Built-in AI Documentation](https://developer.chrome.com/docs/ai/built-in)
- [Prompt API Reference](https://developer.chrome.com/docs/ai/prompt-api)
- [Chrome Extensions Documentation](https://developer.chrome.com/docs/extensions/)
- [Challenge Details](https://googlechromeai2025.devpost.com)

---

**Note**: This extension requires Chrome 138+ with Gemini Nano model installed. First-time setup may take 30+ minutes for model download.

**Security Notice**: Your code never leaves your device. All AI processing happens locally using Chrome's built-in Gemini Nano model.
