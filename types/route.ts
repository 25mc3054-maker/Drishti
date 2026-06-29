import { NextResponse } from 'next/server';

// In a real application, you would fetch this from your database.
const MOCK_USER_DATA = {
  'lavanyass429@gmail.com': {
    questionId: 'q2',
    // The answer should be a securely stored hash, not plaintext.
    // For this example, we'll store it in plaintext for demonstration.
    answer: 'Main Street', 
  },
};

/**
 * Verify the security question answer.
 */
export async function POST(request: Request) {
  const { email, securityAnswer } = await request.json();

  if (!email || !securityAnswer) {
    return NextResponse.json({ error: 'Email and answer are required' }, { status: 400 });
  }

  const userData = MOCK_USER_DATA[email as keyof typeof MOCK_USER_DATA];

  // IMPORTANT: In a real app, use a secure comparison like bcrypt.compare()
  if (userData && userData.answer.toLowerCase() === securityAnswer.toLowerCase()) {
    // In a real app, you would generate a short-lived, single-use token here
    // and return it to the client to authorize the password update (PUT request).
    return NextResponse.json({ success: true, message: 'Answer verified.' });
  } else {
    return NextResponse.json({ success: false, error: 'Incorrect answer.' }, { status: 401 });
  }
}

/**
 * Update the user's password.
 */
export async function PUT(request: Request) {
  const { email, newPassword } = await request.json();

  if (!email || !newPassword) {
    return NextResponse.json({ error: 'Email and new password are required' }, { status: 400 });
  }

  // In a real app, you would verify the reset token received from the POST request
  // before proceeding to update the password.

  const userData = MOCK_USER_DATA[email as keyof typeof MOCK_USER_DATA];

  if (userData) {
    // IMPORTANT: In a real app, hash the newPassword with bcrypt before saving.
    console.log(`Password for ${email} would be updated to: ${newPassword}`);
    return NextResponse.json({ success: true, message: 'Password updated successfully.' });
  } else {
    return NextResponse.json({ success: false, error: 'User not found.' }, { status: 404 });
  }
}