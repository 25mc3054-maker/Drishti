# Drishti Agent - Deployment Guide

## 🚀 Quick Deployment Options

### Option 1: Vercel (Recommended - 30 seconds)

Vercel is the creators of Next.js and offers seamless deployment:

1. **Install Vercel CLI:**
```bash
npm i -g vercel
```

2. **Login to Vercel:**
```bash
vercel login
```

3. **Deploy:**
```bash
cd "d:\My Projects\Drishti"
vercel
```

4. **Add Environment Variable:**
```bash
vercel env add NEXT_PUBLIC_GEMINI_API_KEY production
```
Then paste your Gemini API key when prompted.

5. **Deploy to Production:**
```bash
vercel --prod
```

**Done!** Your app will be live at `https://your-app.vercel.app`

### Option 2: AWS Amplify (Free Tier)

AWS Amplify offers generous free tier limits:

#### Prerequisites:
- AWS Account (free tier eligible)
- GitHub/GitLab repository (optional but recommended)

#### Steps:

1. **Initialize Git Repository:**
```bash
cd "d:\My Projects\Drishti"
git init
git add .
git commit -m "Initial commit: Drishti Agent"
```

2. **Push to GitHub:**
```bash
# Create a new repository on GitHub first
git remote add origin https://github.com/yourusername/drishti-agent.git
git branch -M main
git push -u origin main
```

3. **Deploy via AWS Amplify Console:**
   - Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
   - Click "New app" → "Host web app"
   - Connect your GitHub repository
   - Select the repository and branch
   
4. **Configure Build Settings:**
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

5. **Add Environment Variables:**
   - In Amplify Console, go to "Environment variables"
   - Add: `NEXT_PUBLIC_GEMINI_API_KEY` = `your_api_key`

6. **Deploy:**
   - Save and deploy
   - Your app will be live at `https://main.xxxxx.amplifyapp.com`

### Option 3: Netlify

1. **Install Netlify CLI:**
```bash
npm install -g netlify-cli
```

2. **Login:**
```bash
netlify login
```

3. **Deploy:**
```bash
cd "d:\My Projects\Drishti"
netlify deploy --prod
```

4. **Set Environment Variables:**
```bash
netlify env:set NEXT_PUBLIC_GEMINI_API_KEY your_api_key
```

## 🔐 Environment Variables

Ensure you have these environment variables set in your deployment platform:

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_GEMINI_API_KEY` | Your Google Gemini API Key | `AIzaSy...` |

### Getting Your Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key (starts with `AIzaSy`)
5. **Keep it secret!** Never commit it to Git

## 📊 Performance Optimization

### Pre-deployment Checklist

- [ ] Run production build locally: `npm run build`
- [ ] Check for build errors
- [ ] Test all features in production mode: `npm start`
- [ ] Verify environment variables are set
- [ ] Optimize images (already handled by Next.js)
- [ ] Enable caching headers (automatic with Vercel/Amplify)

### Post-deployment Optimization

1. **Enable Compression:**
   - Vercel: Automatic
   - Amplify: Automatic
   - Self-hosted: Configure nginx/Apache

2. **CDN Configuration:**
   - Vercel: Automatic global CDN
   - Amplify: Uses CloudFront
   - Custom: Set up CloudFlare

3. **Monitoring:**
   - Vercel Analytics: Built-in
   - AWS CloudWatch: For Amplify
   - Google Analytics: Add to `app/layout.tsx`

## 🐛 Troubleshooting

### Build Fails

**Error:** `Module not found: Can't resolve '@/components/...'`

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### API Key Issues

**Error:** `API key not valid`

**Solution:**
1. Verify key in [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Check key is correctly set in environment variables
3. Ensure key has no extra spaces
4. Redeploy after setting environment variables

### Image Upload Fails

**Error:** `Payload too large`

**Solution:**
- Default limit is 10MB (free tier friendly)
- For larger files, upgrade to Gemini Pro (paid)
- Or implement client-side image compression

## 📈 Scaling Considerations

### Free Tier Limits

**Vercel:**
- 100GB bandwidth/month
- 6,000 build minutes/month
- 100 GB-hours serverless function execution
- Perfect for hackathon/MVP

**AWS Amplify:**
- Build & Deploy: 1,000 build minutes/month
- Hosting: 15 GB served/month
- 5 GB storage
- Great for production

**Google Gemini (Free Tier):**
- 60 requests per minute
- 1,500 requests per day
- Suitable for ~150-200 users/day

### When to Upgrade

Upgrade when you hit:
- 500+ daily active users
- Need faster response times
- Require custom domains with SSL
- Want advanced analytics

## 🎯 Custom Domain Setup

### Vercel

1. In Vercel dashboard, go to "Domains"
2. Add your domain: `drishti.yourdomain.com`
3. Update DNS records as shown
4. SSL is automatic

### AWS Amplify

1. Go to "Domain management"
2. Add custom domain
3. Verify domain ownership
4. Update DNS (Route 53 recommended)
5. SSL is automatic via AWS Certificate Manager

## 🔒 Security Best Practices

1. **Never commit `.env.local`** to Git (already in `.gitignore`)
2. **Rotate API keys** regularly (every 90 days)
3. **Enable rate limiting** on API routes
4. **Use HTTPS** (automatic with Vercel/Amplify)
5. **Monitor usage** to detect abuse

## 📱 Mobile Optimization

Already built-in:
- Responsive design (Tailwind breakpoints)
- Touch-friendly UI elements
- Optimized images
- Progressive enhancement

## 🌍 Multi-Region Deployment

### Vercel
- Automatic global edge network
- 70+ regions worldwide
- Zero configuration needed

### AWS Amplify
- Configure multiple regions in console
- Use CloudFront for global CDN
- Route 53 for geo-routing

## 📞 Support

For deployment issues:
- **Vercel:** [vercel.com/support](https://vercel.com/support)
- **AWS:** [AWS Support Center](https://console.aws.amazon.com/support/)
- **Community:** [Next.js Discussions](https://github.com/vercel/next.js/discussions)

---

**Happy Deploying! 🚀**

Your Drishti Agent will be helping businesses across Bharat in no time!
