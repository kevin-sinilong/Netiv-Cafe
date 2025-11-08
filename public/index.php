<?php
require_once 'backend/db_connect.php';
session_start();
?>
<!doctype html>
<html lang="en">

<head>
  <meta charset="utf-8" />
  <title>Netiv Cafe - Login / Register</title>
  <link rel="stylesheet" href="login/index.css" />
</head>

<body>
  <div class="container">
    <div class="card auth-card">
      <h1>Netiv Cafe☕</h1>

      <div id="auth-forms">
        <!-- ✅ LOGIN FORM -->
        <form id="login-form" class="form">
          <h2>Login</h2>

          <!-- Use text input for name -->
          <input id="login-name" type="text" placeholder="Enter Name" required />
          <input id="login-password" type="password" placeholder="Enter Password" required />

          <select id="login-role" required>
            <option value="">Select Role</option>
            <option value="cashier">Cashier</option>
            <option value="admin">Admin</option>
          </select>

          <button type="submit">Login</button>
          <p class="muted">No account? <a href="#" id="show-register">Register</a></p>
        </form>

        <!-- ✅ REGISTER FORM -->
        <form id="register-form" class="form hidden">
          <h2>Create Account</h2>
          <input id="reg-name" type="text" placeholder="Full Name" required />
          <input id="reg-email" type="email" placeholder="Email (for admin only)" required />
          <input id="reg-password" type="password" placeholder="Password" required />

          <select id="reg-role" required>
            <option value="">Select Role</option>
            <option value="cashier">Cashier</option>
            <option value="admin">Admin</option>
          </select>

          <button type="submit">Create</button>
          <p class="muted">Have an account? <a href="#" id="show-login">Login</a></p>
        </form>
      </div>
    </div>
  </div>

  <script src="login/index.js"></script>
</body>

</html>
