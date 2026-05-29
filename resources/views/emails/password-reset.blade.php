@component('mail::message')
# Reset Your Password

You are receiving this email because we received a password reset request for your account.

@component('mail::button', ['url' => $resetUrl])
Reset Password
@endcomponent

If you did not request a password reset, no further action is required. This link will expire in **1 hour**.

@component('mail::subline')
If the button above doesn't work, copy and paste the following link into your browser:  
{{ $resetUrl }}
@endcomponent

Thanks,  
{{ config('app.name', 'PHPAromas') }}
@endcomponent