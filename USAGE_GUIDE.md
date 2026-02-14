# 🎯 Drishti Agent - Complete Usage Guide

## Table of Contents
1. [Getting Started](#getting-started)
2. [How to Use](#how-to-use)
3. [Understanding Results](#understanding-results)
4. [Best Practices](#best-practices)
5. [Example Scenarios](#example-scenarios)
6. [Tips for Hackathon Judges](#tips-for-hackathon-judges)

## Getting Started

### First-Time Setup

1. **Start the Development Server:**
```bash
cd "d:\My Projects\Drishti"
npm run dev
```

2. **Open in Browser:**
   - Navigate to: `http://localhost:3000`
   - You should see the beautiful blue-themed dashboard

3. **Verify API Key:**
   - Check that your `.env.local` file has the Gemini API key
   - The key should start with `AIzaSy...`

## How to Use

### Step 1: Upload Your Business Scenario

**What to Upload:**
- 📸 **Photos of:** Inventory shelves, handwritten notes, process diagrams, storefronts, warehouse layouts
- 🎥 **Videos of:** Store operations, customer flow, production lines
- 📝 **Documents:** Scanned business plans, whiteboard sessions, sketch layouts

**How to Upload:**
1. Click the upload area or drag and drop
2. Select an image (JPEG, PNG, WebP) or video (MP4, MOV)
3. Maximum file size: 10MB
4. Preview appears instantly

**Pro Tip:** 
- Use clear, well-lit images
- Include context (labels, notes, people for scale)
- Multiple angles? Create a collage first

### Step 2: Analyze with AI

1. Click **"Analyze with AI"** button
2. Watch the magic happen:
   - ⬆️ **Uploading:** File sent to server (0-30%)
   - 🧠 **Analyzing:** Gemini AI processes image (30-90%)
   - ✅ **Complete:** Results ready (100%)

**Processing Time:** 
- Simple images: 2-3 seconds
- Complex scenes: 5-8 seconds
- Videos: 8-15 seconds

### Step 3: Review Your Solution

The results are organized into clear sections:

#### 📊 Quick Stats Dashboard
- **Confidence Score:** How certain the AI is
- **Severity Level:** Problem urgency (Low/Medium/High/Critical)
- **Processing Time:** How fast it analyzed
- **Impact Areas:** Number of business areas affected

#### 🔍 Problem Identified
- **Title:** Clear problem statement
- **Description:** Detailed analysis
- **Impact Areas:** Which parts of your business are affected

#### 📈 Optimization Plan
- **Strategy:** Overall approach
- **Mathematical Model:** Scientific formulas and equations
- **Expected Impact:** Projected improvements with numbers
- **Timeline:** How long implementation takes

#### 💻 Implementation Guide
- **Architecture:** Tech stack recommendations
- **Code Structure:** Actual code snippets
- **Dashboard Widgets:** What to display to users

## Understanding Results

### Reading the Confidence Score

- **95-100%:** Highly confident, act immediately
- **85-94%:** Very confident, strong recommendation
- **70-84%:** Confident, verify with domain expert
- **Below 70%:** Low confidence, provide better image

### Severity Levels

| Level | Color | Action | Example |
|-------|-------|--------|---------|
| 🟢 **Low** | Green | Monitor | Minor inefficiency |
| 🟡 **Medium** | Yellow | Plan fix | Process bottleneck |
| 🟠 **High** | Orange | Act soon | Inventory issues |
| 🔴 **Critical** | Red | Act now! | Safety hazard |

### Impact Metrics

The AI shows before/after comparisons:
- **Current Value:** Where you are now
- **Projected Value:** Where you could be
- **Improvement %:** How much better

Example:
```
Inventory Turnover
Current: 4 times/year
Projected: 8 times/year
Improvement: +100% 📈
```

## Best Practices

### 📸 Taking Good Photos

**DO:**
✅ Use good lighting (natural light is best)
✅ Include context (labels, signs, measurements)
✅ Capture the whole scene
✅ Keep camera steady (no blur)
✅ Show any handwritten notes clearly

**DON'T:**
❌ Take photos in dark environments
❌ Crop out important details
❌ Include sensitive customer data
❌ Use heavily filtered images
❌ Upload screenshots of screenshots

### 🎯 Getting Better Results

1. **Add Context:**
   - Write key info on paper visible in photo
   - Include date/time if relevant
   - Show scale (person, object) for size reference

2. **Focus on Problems:**
   - Show the issue clearly
   - Compare with how it should be
   - Document the current state honestly

3. **Multiple Angles:**
   - Take 2-3 photos of same scene
   - Create a collage before uploading
   - Include overview and detail shots

## Example Scenarios

### Scenario 1: Retail Store Inventory

**Upload:**
- Photo of disorganized shelves
- Products mixed, no labels visible

**Expected Analysis:**
- **Problem:** Inefficient inventory layout causing stock confusion
- **Optimization:** ABC analysis categorization model
- **Implementation:** Barcode system with real-time tracking

**Business Impact:**
- 30% faster restocking
- 50% reduction in misplaced items
- Better customer experience

### Scenario 2: Restaurant Kitchen Workflow

**Upload:**
- Video of kitchen operations during peak hours
- Shows chef movement patterns

**Expected Analysis:**
- **Problem:** Inefficient kitchen triangle, wasted motion
- **Optimization:** Work zone optimization using industrial engineering
- **Implementation:** Layout redesign plan with station assignments

**Business Impact:**
- 25% faster order completion
- Reduced chef fatigue
- Higher output capacity

### Scenario 3: Small Business Finances

**Upload:**
- Photo of handwritten profit/loss statement
- Monthly revenue/expense notes

**Expected Analysis:**
- **Problem:** Cash flow management issues
- **Optimization:** Forecasting model with seasonal adjustments
- **Implementation:** Financial dashboard with alerts

**Business Impact:**
- Better cash flow prediction
- 40% reduction in late payments
- Data-driven decision making

### Scenario 4: Warehouse Layout

**Upload:**
- Bird's eye view of warehouse
- Product placement visible

**Expected Analysis:**
- **Problem:** Long picking routes, inefficient space use
- **Optimization:** Slotting optimization using ABC/XYZ analysis
- **Implementation:** Warehouse management system (WMS)

**Business Impact:**
- 45% faster order picking
- 30% better space utilization
- Reduced operational costs

## Tips for Hackathon Judges

### Unique Features to Highlight

1. **Multimodal AI Integration:**
   - Uses Google Gemini 1.5 Flash for vision + language
   - Processes both images and videos
   - Returns structured, actionable JSON

2. **Real-World Problem Solving:**
   - Targets Indian SMBs (Small/Medium Businesses)
   - No expensive consultants needed
   - Instant insights from smartphone camera

3. **Production-Ready Code:**
   - Not a prototype—fully functional MVP
   - Proper error handling
   - Type-safe TypeScript
   - Responsive design

4. **Cost Efficiency:**
   - 100% free-tier technologies
   - No credit card required
   - Scalable architecture

5. **Beautiful UI/UX:**
   - Google AI Studio-inspired design
   - Smooth animations (Framer Motion)
   - Mobile-first approach

### Demo Flow for Judges

**Scenario:** Local grocery store owner with inventory problems

1. **Show Problem:** 
   - Upload photo of messy shelves
   - Point out the disorganization

2. **Analyze:**
   - Click "Analyze with AI"
   - Show real-time progress

3. **Present Solution:**
   - Walk through problem identification
   - Explain the mathematical model
   - Show code implementation guide

4. **Highlight Impact:**
   - 40% faster restocking
   - 35% reduction in waste
   - Real ROI numbers

5. **Technical Excellence:**
   - Show the code architecture
   - Explain API integration
   - Demonstrate responsiveness

### Questions Judges Might Ask

**Q: Why Gemini over other AI models?**
A: Gemini 1.5 Flash offers:
- Multimodal capabilities (vision + text)
- Free tier with generous limits
- Fast inference (2-5 seconds)
- High accuracy for Indian contexts

**Q: How does this help small businesses in India?**
A: 
- No expensive consultants (₹50,000-5,00,000 saved)
- Mobile-first (smartphone camera is enough)
- Regional language support (planned)
- Targets real Bharat problems

**Q: Can this scale?**
A:
- Built on Next.js (scales horizontally)
- Serverless architecture (auto-scaling)
- CDN-ready (Vercel/Amplify)
- Database-ready (can add Postgres/MongoDB)

**Q: What's next for Drishti?**
Roadmap:
- ✅ MVP with vision analysis (DONE)
- 🔄 Multi-language support (Hindi, Tamil, etc.)
- 📱 Mobile app (React Native)
- 🤝 WhatsApp integration
- 💰 Freemium model

## Troubleshooting

### "Analysis failed"

**Causes:**
- API key invalid
- Image file corrupted
- Network error
- Gemini rate limit hit

**Solutions:**
1. Check internet connection
2. Verify API key in `.env.local`
3. Try a different image
4. Wait 60 seconds (rate limit reset)

### "Slow processing"

**Causes:**
- Large file size
- Complex scene
- Peak usage time

**Solutions:**
1. Compress image before upload
2. Use simpler images
3. Wait and retry

### "Unclear results"

**Causes:**
- Poor image quality
- Insufficient context
- Ambiguous scenario

**Solutions:**
1. Retake photo with better lighting
2. Add written context to image
3. Try multiple angles

## Advanced Usage

### For Developers

**Customize the System Prompt:**

Edit `app/api/vision/route.ts`:

```typescript
const EXPERT_SYSTEM_PROMPT = `
Your custom prompt here...
Focus on: [specific industry]
Output format: [custom structure]
`;
```

**Add New Features:**

1. **Save History:**
   - Add Supabase/Firebase
   - Store analysis results
   - Show past analyses

2. **Export Reports:**
   - Generate PDF reports
   - Email summaries
   - Share links

3. **Team Collaboration:**
   - Multiple users
   - Comment on analyses
   - Assign action items

4. **Industry Specialization:**
   - Retail-specific models
   - Manufacturing focus
   - Healthcare optimization

## Support & Feedback

- **Issues?** Check the troubleshooting section
- **Ideas?** We're open to suggestions!
- **Questions?** Read the README.md

---

**Built with ❤️ for Bharat's entrepreneurs**

Start transforming your business today! 🚀
