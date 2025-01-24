import React, { useState } from 'react';
import Button from './Button';
import { srpUtility } from '../utilities/SrpUtility';
import EncryptionUtility from '../utilities/EncryptionUtility';

const Login: React.FC = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      // 1. Initiate login to get salt and server ephemeral
      const loginResponse = await srpUtility.initiateLogin(credentials.username);

      // 1. Derive key from password using Argon2id
      const passwordHashString = await EncryptionUtility.deriveKeyFromPassword(
        credentials.password,
        loginResponse.salt,
        loginResponse.encryptionType,
        loginResponse.encryptionSettings
      );

      // 2. Validate login with SRP protocol
      const validationResponse = await srpUtility.validateLogin(
        credentials.username,
        passwordHashString,
        rememberMe,
        loginResponse
      );

      // Store access and refresh token
      if (validationResponse.token) {
        localStorage.setItem('accessToken', validationResponse.token!.token);
        localStorage.setItem('refreshToken', validationResponse.token!.refreshToken);
      }
      else {
        throw new Error('Login failed -- no token returned');
      }

        // Make another API call trying to get latest vault
        const vaultResponse = await fetch('https://localhost:7223/v1/Vault', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            }
        });

        const vaultResponseJson = await vaultResponse.json();

        console.log('Vault response:')
        console.log('--------------------------------');
        console.log(vaultResponseJson);
        console.log('Encrypted blob:');
        console.log(vaultResponseJson.vault.blob);


      // 3. Handle 2FA if required
      /*if (validationResponse.requiresTwoFactor) {
        // TODO: Implement 2FA flow
        console.log('2FA required');
        return;
      }

      // 4. Store tokens
      if (validationResponse.token) {
        localStorage.setItem('accessToken', validationResponse.token.token);
        localStorage.setItem('refreshToken', validationResponse.token.refreshToken);
      }

      // 5. Redirect to home page
      window.location.href = '/';*/

    } catch (err) {
      setError('Login failed. Please check your credentials and try again.');
      console.error('Login error:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="max-w-md">
      <form onSubmit={handleSubmit} className="bg-white w-full shadow-md rounded px-8 pt-6 pb-8 mb-4">
        {error && (
          <div className="mb-4 text-red-500 text-sm">
            {error}
          </div>
        )}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
            Username
          </label>
          <input
            className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="username"
            type="text"
            name="username"
            placeholder="Enter your username"
            value={credentials.username}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
            Password
          </label>
          <input
            className="shadow appearance-none border rounded py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
            id="password"
            type="password"
            name="password"
            placeholder="Enter your password"
            value={credentials.password}
            onChange={handleChange}
            required
          />
        </div>
        <div className="flex items-center justify-between">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm">Remember me</span>
          </label>
          <Button type="submit">
            Login
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Login;