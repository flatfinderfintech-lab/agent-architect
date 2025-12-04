import { View, StyleSheet } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import { useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const { isSignedIn } = useAuth();
  const router = useRouter();

  if (isSignedIn) {
    router.replace('/dashboard');
    return null;
  }

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineLarge" style={styles.title}>
            Prototype.Cafe Agent Creator
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Build, deploy, and monetize AI agents without coding
          </Text>
        </Card.Content>
        <Card.Actions>
          <Button mode="contained" onPress={() => router.push('/sign-in')}>
            Sign In
          </Button>
          <Button mode="outlined" onPress={() => router.push('/sign-up')}>
            Sign Up
          </Button>
        </Card.Actions>
      </Card>

      <View style={styles.features}>
        <Card style={styles.featureCard}>
          <Card.Content>
            <Text variant="titleMedium">🤖 Create Agents</Text>
            <Text variant="bodySmall">Build AI agents with simple prompts</Text>
          </Card.Content>
        </Card>

        <Card style={styles.featureCard}>
          <Card.Content>
            <Text variant="titleMedium">🛠️ Tool Store</Text>
            <Text variant="bodySmall">Browse and attach powerful tools</Text>
          </Card.Content>
        </Card>

        <Card style={styles.featureCard}>
          <Card.Content>
            <Text variant="titleMedium">💰 Marketplace</Text>
            <Text variant="bodySmall">Publish and monetize your agents</Text>
          </Card.Content>
        </Card>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  card: {
    marginBottom: 20,
  },
  title: {
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 20,
  },
  features: {
    gap: 10,
  },
  featureCard: {
    marginBottom: 10,
  },
});
