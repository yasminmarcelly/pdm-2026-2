
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';

const API = 'https://parseapi.back4app.com';

const HEADERS = {
  'X-Parse-Application-Id':
    process.env.EXPO_PUBLIC_PARSE_APP_ID ?? '',
  'X-Parse-REST-API-Key':
    process.env.EXPO_PUBLIC_PARSE_REST_KEY ?? '',
  'Content-Type': 'application/json',
};

type User = {
  objectId: string;
  username: string;
  email?: string;
  createdAt?: string;
};

export default function Index() {
  const [screen, setScreen] = useState<'login' | 'signup' | 'profile'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [sessionToken, setSessionToken] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function readResponse(response: Response) {
    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || 'Não foi possível concluir a operação.'
      );
    }

    return data;
  }

  async function loadProfile(token: string) {
    const response = await fetch(`${API}/users/me`, {
      method: 'GET',
      headers: {
        ...HEADERS,
        'X-Parse-Session-Token': token,
      },
    });

    const data = await readResponse(response);

    setUser(data);
    setSessionToken(token);
    setScreen('profile');
    setPassword('');
  }

  async function signup() {
    if (!username.trim() || !email.trim() || !password) {
      setError('Preencha nome de usuário, e-mail e senha.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API}/users`, {
        method: 'POST',
        headers: {
          ...HEADERS,
          'X-Parse-Revocable-Session': '1',
        },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = await readResponse(response);

      if (data.sessionToken) {
        await loadProfile(data.sessionToken);
      } else {
        setPassword('');
        setScreen('login');
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Erro ao cadastrar.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function login() {
    if (!username.trim() || !password) {
      setError('Preencha o usuário e a senha.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        username: username.trim(),
        password,
      });

      const response = await fetch(`${API}/login?${params.toString()}`, {
        method: 'GET',
        headers: HEADERS,
      });

      const data = await readResponse(response);

      await loadProfile(data.sessionToken);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Erro ao entrar.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API}/logout`, {
        method: 'POST',
        headers: {
          ...HEADERS,
          'X-Parse-Session-Token': sessionToken,
        },
      });

      await readResponse(response);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Erro ao sair.'
      );
      setLoading(false);
      return;
    }

    setUser(null);
    setSessionToken('');
    setPassword('');
    setScreen('login');
    setLoading(false);
  }

  function changeScreen(next: 'login' | 'signup') {
    setError('');
    setPassword('');
    setScreen(next);
  }

  if (screen === 'profile') {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Meu perfil</Text>
          <Text style={styles.subtitle}>
            Dados do usuário autenticado
          </Text>

          <Text style={styles.label}>Nome de usuário</Text>
          <Text style={styles.value}>{user?.username}</Text>

          <Text style={styles.label}>E-mail</Text>
          <Text style={styles.value}>
            {user?.email || 'Não informado'}
          </Text>

          <Text style={styles.label}>ID do usuário</Text>
          <Text style={styles.value}>{user?.objectId}</Text>

          <Text style={styles.label}>Data de criação</Text>
          <Text style={styles.value}>
            {user?.createdAt
              ? new Date(user.createdAt).toLocaleString()
              : 'Não informada'}
          </Text>

          {!!error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            style={styles.button}
            onPress={logout}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Saindo...' : 'Sair da conta'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const isSignup = screen === 'signup';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>
          {isSignup ? 'Criar conta' : 'Bem-vindo(a)!'}
        </Text>

        <Text style={styles.subtitle}>
          {isSignup
            ? 'Cadastre-se no Back4App'
            : 'Entre na sua conta'}
        </Text>

        <Text style={styles.label}>Nome de usuário</Text>
        <TextInput
          style={styles.input}
          placeholder="Digite seu usuário"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          editable={!loading}
        />

        {isSignup && (
          <>
            <Text style={styles.label}>E-mail</Text>
            <TextInput
              style={styles.input}
              placeholder="seu@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
          </>
        )}

        <Text style={styles.label}>Senha</Text>
        <TextInput
          style={styles.input}
          placeholder="Digite sua senha"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
        />

        {!!error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          style={styles.button}
          onPress={isSignup ? signup : login}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>
              {isSignup ? 'Cadastrar' : 'Entrar'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => changeScreen(isSignup ? 'login' : 'signup')}
          disabled={loading}
        >
          <Text style={styles.link}>
            {isSignup
              ? 'Já possui conta? Faça login'
              : 'Não possui conta? Cadastre-se'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 16,
    gap: 10,
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  button: {
    backgroundColor: '#2563eb',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  link: {
    color: '#2563eb',
    textAlign: 'center',
    marginTop: 12,
    padding: 8,
  },
  error: {
    color: '#dc2626',
    marginTop: 8,
  },
  value: {
    color: '#0f172a',
    fontSize: 16,
    marginBottom: 8,
  },
});
