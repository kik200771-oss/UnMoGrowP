// DNS Test для Resend после исправления
import { Resend } from 'resend';

const resend = new Resend('re_6m8G3ocE_N3usf9UKJf3pD4wntT3N5R4D');

async function testDNSFix() {
  console.log('🔍 Testing DNS configuration...');

  try {
    const result = await resend.emails.send({
      from: 'UnMoGrowP <noreply@unmogrowp.com>',
      to: ['test@gmail.com'], // замените на свой email
      subject: 'DNS Fix Test - ' + new Date().toLocaleString(),
      html: `
        <h2>DNS Configuration Test</h2>
        <p>Если вы получили это письмо, значит DNS настроен правильно!</p>
        <ul>
          <li>✅ DKIM: Verified</li>
          <li>✅ SPF: Should be working</li>
          <li>✅ MX: Fixed or removed</li>
        </ul>
        <p>Время отправки: ${new Date().toLocaleString()}</p>
      `
    });

    console.log('✅ Email sent successfully!');
    console.log('📧 Message ID:', result.data?.id);
    console.log('🎯 Check your inbox!');

  } catch (error) {
    console.error('❌ Email sending failed:');
    console.error('Error message:', error.message);
    console.error('Full error:', error);
  }
}

testDNSFix();