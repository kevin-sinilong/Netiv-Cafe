// index.js - login/register - CORRECTED VERSION
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const regForm = document.getElementById('register-form');
    const showReg = document.getElementById('show-register');
    const showLogin = document.getElementById('show-login');

    // Toggle forms
    showReg.addEventListener('click', e => {
        e.preventDefault();
        loginForm.classList.add('hidden');
        regForm.classList.remove('hidden');
    });
    showLogin.addEventListener('click', e => {
        e.preventDefault();
        regForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
    });

    // ---------- REGISTER ----------
    regForm.addEventListener('submit', async e => {
        e.preventDefault();
        const name = document.getElementById('reg-name').value.trim();
        const email = document.getElementById('reg-email').value.trim().toLowerCase();
        const password = document.getElementById('reg-password').value;
        const role = document.getElementById('reg-role').value;

        if (!name || !email || !password || !role) return alert('All fields are required');

        try {
            const res = await fetch('backend/auth.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'register', name, email, password, role })
            });
            const data = await res.json();
            alert(data.message);
            if (data.success) {
                regForm.reset();
                regForm.classList.add('hidden');
                loginForm.classList.remove('hidden');
            }
        } catch (err) {
            alert('Error: ' + err.message);
        }
    });

    // ---------- LOGIN ----------
    loginForm.addEventListener('submit', async e => {
        e.preventDefault();

        const name = document.getElementById('login-name').value.trim();
        const password = document.getElementById('login-password').value;
        const role = document.getElementById('login-role').value;

        console.log('🔐 LOGIN ATTEMPT:', { name, password: '***', role });

        if (!name || !password || !role) return alert('All fields are required');

        try {
            const res = await fetch('backend/auth.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'login', 
                    name: name,        // This becomes 'full_name' in PHP
                    password: password, 
                    role: role 
                })
            });

            console.log('Response status:', res.status);
            
            // ✅ FIX: Check if response is OK before parsing JSON
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            
            const responseText = await res.text();
            console.log('Raw response:', responseText);
            
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                throw new Error('Invalid response from server');
            }
            
            console.log('Login response:', data);

            if (data.success) {
                console.log('✅ LOGIN SUCCESS - User data:', data.user);
                console.log('User role:', data.user.role);
                
                // Store user data
                sessionStorage.setItem('user', JSON.stringify(data.user));
                
                // Verify storage
                const storedUser = sessionStorage.getItem('user');
                console.log('Stored user:', storedUser);
                
                // ✅ FIX: Redirect based on ACTUAL user role from server, not form input
                if (data.user.role === 'admin') {
                    console.log('Redirecting to admin.php');
                    window.location.href = 'admin.php';
                } else if (data.user.role === 'cashier') {
                    console.log('Redirecting to cashier.php');
                    window.location.href = 'cashier.php';
                } else {
                    alert('Unknown user role: ' + data.user.role);
                }
            } else {
                console.log('❌ LOGIN FAILED:', data.message);
                alert('Login failed: ' + data.message);
            }
        } catch (err) {
            console.error('💥 LOGIN ERROR:', err);
            alert('Error: ' + err.message);
        }
    });
});