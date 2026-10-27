import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Header } from '../../components/Header';
import { colors } from '../../constants/colors';
import { isSupabaseConfigured } from '../../lib/supabase';
import { addMeal, getMealsForToday, type Meal } from '../../services/mealService';

export default function RefeicoesScreen() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    try { setMeals(await getMealsForToday()); }
    catch (error) { Alert.alert('Refeições', error instanceof Error ? error.message : 'Não foi possível carregar suas refeições.'); }
    finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  async function saveMeal() {
    if (!name.trim()) { Alert.alert('Informe a refeição', 'Digite o nome ou o alimento antes de salvar.'); return; }
    setSaving(true);
    try {
      const meal = await addMeal({ name });
      setMeals((current) => [...current, meal]);
      setName('');
    } catch (error) { Alert.alert('Não foi possível salvar', error instanceof Error ? error.message : 'Tente novamente.'); }
    finally { setSaving(false); }
  }

  return (
    <View style={styles.screen}>
      <Header />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Refeições</Text>
        <Text style={styles.subtitle}>Acompanhe o que você comeu hoje.</Text>
        {!isSupabaseConfigured ? <Text style={styles.notice}>Configure o Supabase no arquivo .env para salvar suas refeições.</Text> : (
          <View style={styles.form}>
            <TextInput accessibilityLabel="Nome da refeição ou alimento" onChangeText={setName} onSubmitEditing={() => void saveMeal()} placeholder="Ex.: Almoço, arroz e feijão" placeholderTextColor={colors.mutedText} style={styles.input} value={name} />
            <Pressable accessibilityRole="button" disabled={saving} onPress={() => void saveMeal()} style={styles.button}><Text style={styles.buttonText}>{saving ? 'Salvando...' : 'Adicionar refeição'}</Text></Pressable>
          </View>
        )}
        <Text style={styles.sectionTitle}>Registros de hoje</Text>
        {loading ? <Text style={styles.subtitle}>Carregando...</Text> : null}
        {!loading && meals.length === 0 ? <Text style={styles.subtitle}>Nenhuma refeição registrada hoje.</Text> : null}
        {meals.map((meal) => (
          <View key={meal.id} style={styles.card}>
            <Text style={styles.mealName}>{meal.name}</Text>
            <Text style={styles.subtitle}>{meal.description || new Date(meal.consumed_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</Text>
            {meal.calories != null ? <Text style={styles.subtitle}>{meal.calories} kcal</Text> : null}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.white, flex: 1 },
  content: { flexGrow: 1, gap: 14, padding: 20 },
  title: { color: colors.text, fontSize: 24, fontWeight: '800', marginTop: 12 },
  subtitle: { color: colors.mutedText, fontSize: 14 },
  form: { gap: 10 },
  input: { backgroundColor: '#F8FAFC', borderColor: '#D0D5DD', borderRadius: 12, borderWidth: 1, color: colors.text, minHeight: 48, paddingHorizontal: 14 },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: '700', marginTop: 8 },
  notice: { backgroundColor: '#FFF4E5', borderRadius: 12, color: colors.text, lineHeight: 21, padding: 14 },
  card: { backgroundColor: '#EAF4FF', borderRadius: 16, gap: 8, padding: 18 },
  mealName: { color: colors.text, fontSize: 17, fontWeight: '700' },
  button: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 12, justifyContent: 'center', minHeight: 52 },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: '700' },
});
