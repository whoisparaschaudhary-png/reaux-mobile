import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeScreen } from '../../../src/components/layout/SafeScreen';
import { Header } from '../../../src/components/layout/Header';
import { Button } from '../../../src/components/ui/Button';
import { Input } from '../../../src/components/ui/Input';
import { useCartStore } from '../../../src/stores/useCartStore';
import { addressesApi } from '../../../src/api/endpoints/users';
import { showAppAlert } from '../../../src/stores/useUIStore';
import { colors, fontFamily, spacing, borderRadius, shadows } from '../../../src/theme';
import type { SavedAddress } from '../../../src/types/models';

const CITIES_BY_STATE: Record<string, string[]> = {
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Tirupati', 'Rajahmundry', 'Kakinada', 'Anantapur', 'Kadapa', 'Eluru', 'Ongole', 'Nandyal', 'Machilipatnam'],
  'Arunachal Pradesh': ['Itanagar', 'Naharlagun', 'Pasighat', 'Tawang', 'Ziro', 'Bomdila'],
  'Assam': ['Guwahati', 'Dibrugarh', 'Jorhat', 'Silchar', 'Nagaon', 'Tinsukia', 'Tezpur', 'Bongaigaon', 'Dhubri', 'Diphu'],
  'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia', 'Darbhanga', 'Bihar Sharif', 'Arrah', 'Begusarai', 'Katihar', 'Munger', 'Chapra'],
  'Chhattisgarh': ['Raipur', 'Bhilai', 'Korba', 'Bilaspur', 'Durg', 'Rajnandgaon', 'Jagdalpur', 'Ambikapur', 'Raigarh'],
  'Goa': ['Panaji', 'Vasco da Gama', 'Margao', 'Mapusa', 'Ponda', 'Calangute', 'Candolim'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Gandhinagar', 'Junagadh', 'Anand', 'Navsari', 'Morbi', 'Nadiad', 'Mehsana', 'Bharuch', 'Surendranagar'],
  'Haryana': ['Gurgaon', 'Faridabad', 'Panipat', 'Ambala', 'Yamunanagar', 'Rohtak', 'Hisar', 'Karnal', 'Sonipat', 'Panchkula', 'Bhiwani', 'Sirsa', 'Rewari', 'Kaithal'],
  'Himachal Pradesh': ['Shimla', 'Manali', 'Dharamshala', 'Solan', 'Mandi', 'Baddi', 'Nahan', 'Palampur', 'Kullu'],
  'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Hazaribagh', 'Deoghar', 'Giridih', 'Ramgarh', 'Phusro', 'Medininagar'],
  'Karnataka': ['Bangalore', 'Mysore', 'Hubli', 'Mangalore', 'Belgaum', 'Gulbarga', 'Davanagere', 'Bellary', 'Bijapur', 'Shimoga', 'Tumkur', 'Raichur', 'Hassan', 'Udupi'],
  'Kerala': ['Kochi', 'Thiruvananthapuram', 'Kozhikode', 'Thrissur', 'Kannur', 'Kollam', 'Palakkad', 'Alappuzha', 'Kottayam', 'Malappuram', 'Kasaragod'],
  'Madhya Pradesh': ['Indore', 'Bhopal', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Ratlam', 'Satna', 'Murwara', 'Singrauli', 'Rewa', 'Dewas', 'Burhanpur', 'Chhindwara'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Thane', 'Aurangabad', 'Navi Mumbai', 'Solapur', 'Kolhapur', 'Amravati', 'Nanded', 'Sangli', 'Malegaon', 'Jalgaon', 'Akola', 'Latur', 'Dhule', 'Chandrapur', 'Parbhani'],
  'Manipur': ['Imphal', 'Thoubal', 'Bishnupur', 'Churachandpur', 'Kakching'],
  'Meghalaya': ['Shillong', 'Tura', 'Jowai', 'Nongstoin', 'Williamnagar'],
  'Mizoram': ['Aizawl', 'Lunglei', 'Champhai', 'Serchhip', 'Kolasib'],
  'Nagaland': ['Kohima', 'Dimapur', 'Mokokchung', 'Tuensang', 'Wokha'],
  'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Brahmapur', 'Sambalpur', 'Puri', 'Balasore', 'Baripada', 'Bhadrak', 'Jharsuguda'],
  'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Hoshiarpur', 'Batala', 'Pathankot', 'Moga', 'Ferozepur', 'Abohar', 'Gurdaspur', 'Sangrur', 'Rupnagar'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer', 'Bikaner', 'Alwar', 'Bhilwara', 'Bharatpur', 'Pali', 'Sikar', 'Sri Ganganagar', 'Barmer', 'Tonk'],
  'Sikkim': ['Gangtok', 'Namchi', 'Pelling', 'Rangpo', 'Singtam'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Tiruppur', 'Vellore', 'Erode', 'Thoothukudi', 'Dindigul', 'Thanjavur', 'Ranipet', 'Hosur', 'Nagercoil'],
  'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam', 'Ramagundam', 'Mahbubnagar', 'Nalgonda', 'Adilabad', 'Suryapet'],
  'Tripura': ['Agartala', 'Dharmanagar', 'Udaipur', 'Kailashahar', 'Belonia'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Meerut', 'Allahabad', 'Ghaziabad', 'Noida', 'Bareilly', 'Aligarh', 'Moradabad', 'Saharanpur', 'Gorakhpur', 'Firozabad', 'Jhansi', 'Mathura', 'Muzaffarnagar', 'Rampur', 'Shahjahanpur', 'Ayodhya'],
  'Uttarakhand': ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rudrapur', 'Kashipur', 'Rishikesh', 'Nainital', 'Mussoorie'],
  'West Bengal': ['Kolkata', 'Howrah', 'Asansol', 'Siliguri', 'Durgapur', 'Bardhaman', 'Malda', 'Baharampur', 'Habra', 'Kharagpur', 'Shantipur', 'Darjeeling', 'Jalpaiguri'],
  'Andaman and Nicobar Islands': ['Port Blair', 'Diglipur', 'Rangat'],
  'Chandigarh': ['Chandigarh'],
  'Dadra and Nagar Haveli and Daman and Diu': ['Silvassa', 'Daman', 'Diu'],
  'Delhi': ['New Delhi', 'Delhi', 'Dwarka', 'Rohini', 'Janakpuri', 'Saket', 'Lajpat Nagar', 'Karol Bagh', 'Pitampura', 'Noida Extension'],
  'Jammu and Kashmir': ['Srinagar', 'Jammu', 'Anantnag', 'Sopore', 'Baramulla', 'Kathua', 'Udhampur'],
  'Ladakh': ['Leh', 'Kargil'],
  'Lakshadweep': ['Kavaratti', 'Agatti'],
  'Puducherry': ['Puducherry', 'Karaikal', 'Mahe', 'Yanam'],
};


const OTHER_CITY = '__OTHER__';

export default function AddressScreen() {
  const [form, setForm] = useState({ label: 'Home', street: '', city: '', state: '', pincode: '', phone: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showStatePicker, setShowStatePicker] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showCustomCity, setShowCustomCity] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const setSelectedAddress = useCartStore((s) => s.setSelectedAddress);

  const loadAddresses = useCallback(async () => {
    setLoadingAddresses(true);
    try {
      const res = await addressesApi.list();
      setSavedAddresses(res.data ?? []);
    } catch {
      // Silently fail
    } finally {
      setLoadingAddresses(false);
    }
  }, []);

  useEffect(() => { loadAddresses(); }, []);

  const updateField = useCallback((field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  }, []);

  const prefillFromSaved = useCallback((addr: SavedAddress) => {
    setForm({ label: addr.label, street: addr.street, city: addr.city, state: addr.state, pincode: addr.pincode, phone: addr.phone });
    setErrors({});
    // Check if saved city is in list or custom
    const cities = CITIES_BY_STATE[addr.state] ?? [];
    setShowCustomCity(!!addr.city && !cities.includes(addr.city));
  }, []);

  const handleSelectAndBack = useCallback((addr: SavedAddress) => {
    setSelectedAddress({ street: addr.street, city: addr.city, state: addr.state, pincode: addr.pincode, phone: addr.phone });
    router.back();
  }, [setSelectedAddress]);

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};
    if (!form.street.trim()) newErrors.street = 'Street address is required';
    if (!form.city.trim()) newErrors.city = 'City is required';
    if (!form.state.trim()) newErrors.state = 'State is required';
    if (!form.pincode.trim()) newErrors.pincode = 'Pincode is required';
    if (!form.phone.trim()) newErrors.phone = 'Phone number is required';
    else if (form.phone.trim().length !== 10) newErrors.phone = 'Enter a valid 10-digit number';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form]);

  const handleSave = useCallback(async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await addressesApi.add({ label: form.label || 'Home', street: form.street.trim(), city: form.city.trim(), state: form.state.trim(), pincode: form.pincode.trim(), phone: form.phone.trim() });
      if (res.data) setSavedAddresses(res.data);
      setSelectedAddress({ street: form.street.trim(), city: form.city.trim(), state: form.state.trim(), pincode: form.pincode.trim(), phone: form.phone.trim() });
      showAppAlert('Address Saved', 'Your shipping address has been saved.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (err: any) {
      showAppAlert('Error', err.message || 'Failed to save address');
    } finally {
      setSaving(false);
    }
  }, [validate, form, setSelectedAddress]);

  const handleDelete = useCallback(async (id: string) => {
    setDeletingId(id);
    try {
      const res = await addressesApi.delete(id);
      if (res.data) {
        setSavedAddresses(res.data);
      } else {
        setSavedAddresses((prev) => prev.filter((a) => a._id !== id));
      }
    } catch (err: any) {
      showAppAlert('Error', err.message || 'Failed to delete address');
    } finally {
      setDeletingId(null);
    }
  }, []);

  return (
    <SafeScreen>
      <Header title="Addresses" showBack onBack={() => router.back()} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={100}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

          {loadingAddresses ? (
            <ActivityIndicator color={colors.primary.yellow} style={{ marginVertical: spacing.xl }} />
          ) : savedAddresses.length > 0 ? (
            <View style={styles.savedSection}>
              <Text style={styles.savedTitle}>Saved Addresses</Text>
              {savedAddresses.map((addr) => (
                <View key={addr._id} style={[styles.savedCard, shadows.card]}>
                  <TouchableOpacity style={styles.savedCardBody} onPress={() => handleSelectAndBack(addr)} activeOpacity={0.7}>
                    <Ionicons name={addr.isDefault ? 'location' : 'location-outline'} size={20} color={addr.isDefault ? colors.primary.yellowDark : colors.text.secondary} />
                    <View style={styles.savedCardText}>
                      <View style={styles.savedCardLabelRow}>
                        <Text style={styles.savedCardLabel}>{addr.label}</Text>
                        {addr.isDefault && <View style={styles.defaultBadge}><Text style={styles.defaultBadgeText}>Default</Text></View>}
                      </View>
                      <Text style={styles.savedCardStreet} numberOfLines={1}>{addr.street}</Text>
                      <Text style={styles.savedCardDetail}>{addr.city}, {addr.state} - {addr.pincode}</Text>
                      <Text style={styles.savedCardPhone}>{addr.phone}</Text>
                    </View>
                    <View style={styles.savedCardActions}>
                      <TouchableOpacity onPress={() => prefillFromSaved(addr)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Ionicons name="pencil-outline" size={16} color={colors.text.secondary} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDelete(addr._id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} disabled={deletingId === addr._id}>
                        {deletingId === addr._id ? <ActivityIndicator size="small" color={colors.status.error} /> : <Ionicons name="trash-outline" size={16} color={colors.status.error} />}
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                </View>
              ))}
              <View style={styles.divider} />
              <Text style={styles.addNewLabel}>Add New Address</Text>
            </View>
          ) : null}

          {/* Label chips */}
          <View style={styles.labelRow}>
            {['Home', 'Work', 'Other'].map((l) => (
              <TouchableOpacity key={l} style={[styles.labelChip, form.label === l && styles.labelChipActive]} onPress={() => updateField('label', l)} activeOpacity={0.7}>
                <Text style={[styles.labelChipText, form.label === l && styles.labelChipTextActive]}>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input label="Street Address" placeholder="123 Main Street, Apt 4B" value={form.street} onChangeText={(t) => updateField('street', t)} error={errors.street} />
          <View style={styles.spacer} />

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.fieldLabel}>State</Text>
              <TouchableOpacity style={[styles.stateDropdown, errors.state ? styles.stateDropdownError : null]} onPress={() => setShowStatePicker(true)} activeOpacity={0.7}>
                <Text style={[styles.stateDropdownText, !form.state && styles.statePlaceholder]}>{form.state || 'Select State'}</Text>
                <Ionicons name="chevron-down" size={16} color={colors.text.light} />
              </TouchableOpacity>
              {errors.state ? <Text style={styles.errorText}>{errors.state}</Text> : null}
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.fieldLabel}>City</Text>
              <TouchableOpacity style={[styles.stateDropdown, errors.city ? styles.stateDropdownError : null]} onPress={() => setShowCityPicker(true)} activeOpacity={0.7}>
                <Text style={[styles.stateDropdownText, !form.city && !showCustomCity && styles.statePlaceholder]}>
                  {showCustomCity ? 'Other' : (form.city || 'Select City')}
                </Text>
                <Ionicons name="chevron-down" size={16} color={colors.text.light} />
              </TouchableOpacity>
              {errors.city ? <Text style={styles.errorText}>{errors.city}</Text> : null}
            </View>
          </View>
          {showCustomCity && (
            <View style={styles.spacer}>
              <Input
                label="Enter City Name"
                placeholder="e.g. Hoshiarpur"
                value={form.city}
                onChangeText={(t) => updateField('city', t)}
                error={errors.city}
              />
            </View>
          )}
          <View style={styles.spacer} />

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Input label="Pincode" placeholder="560001" value={form.pincode} onChangeText={(t) => updateField('pincode', t.replace(/\D/g, ''))} keyboardType="number-pad" maxLength={6} error={errors.pincode} />
            </View>
            <View style={styles.halfInput}>
              <Input label="Phone (10 digits)" placeholder="9876543210" value={form.phone} onChangeText={(t) => updateField('phone', t.replace(/\D/g, ''))} keyboardType="number-pad" maxLength={10} error={errors.phone} />
            </View>
          </View>

          <View style={styles.buttonWrap}>
            <Button title="Save Address" onPress={handleSave} fullWidth size="lg" loading={saving} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showStatePicker} animationType="slide" transparent onRequestClose={() => setShowStatePicker(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowStatePicker(false)}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Select State</Text>
            <FlatList
              data={Object.keys(CITIES_BY_STATE).sort()}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.stateOption, form.state === item && styles.stateOptionActive]}
                  onPress={() => {
                    setForm((prev) => ({ ...prev, state: item, city: '' }));
                    setErrors((prev) => ({ ...prev, state: '', city: '' }));
                    setShowCustomCity(false);
                    setShowStatePicker(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.stateOptionText, form.state === item && styles.stateOptionTextActive]}>{item}</Text>
                  {form.state === item && <Ionicons name="checkmark" size={18} color={colors.primary.yellowDark} />}
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showCityPicker} animationType="slide" transparent onRequestClose={() => setShowCityPicker(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowCityPicker(false)}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Select City</Text>
            {!form.state ? (
              <View style={styles.cityPromptWrap}>
                <Ionicons name="location-outline" size={32} color={colors.text.light} />
                <Text style={styles.cityPromptText}>Please select a state first</Text>
              </View>
            ) : (
              <FlatList
                data={[...(CITIES_BY_STATE[form.state] ?? []), OTHER_CITY]}
                keyExtractor={(item) => item}
                renderItem={({ item }) => {
                  if (item === OTHER_CITY) {
                    return (
                      <TouchableOpacity
                        style={[styles.stateOption, showCustomCity && styles.stateOptionActive]}
                        onPress={() => {
                          setShowCustomCity(true);
                          updateField('city', '');
                          setShowCityPicker(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.stateOptionText, showCustomCity && styles.stateOptionTextActive]}>
                          Other (type manually)
                        </Text>
                        {showCustomCity && <Ionicons name="checkmark" size={18} color={colors.primary.yellowDark} />}
                      </TouchableOpacity>
                    );
                  }
                  return (
                    <TouchableOpacity
                      style={[styles.stateOption, form.city === item && !showCustomCity && styles.stateOptionActive]}
                      onPress={() => { setShowCustomCity(false); updateField('city', item); setShowCityPicker(false); }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.stateOptionText, form.city === item && !showCustomCity && styles.stateOptionTextActive]}>{item}</Text>
                      {form.city === item && !showCustomCity && <Ionicons name="checkmark" size={18} color={colors.primary.yellowDark} />}
                    </TouchableOpacity>
                  );
                }}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.xxxl },
  savedSection: { marginBottom: spacing.xl },
  savedTitle: { fontFamily: fontFamily.bold, fontSize: 16, color: colors.text.primary, marginBottom: spacing.md },
  savedCard: { backgroundColor: colors.background.white, borderRadius: borderRadius.md, marginBottom: spacing.sm },
  savedCardBody: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  savedCardText: { flex: 1 },
  savedCardLabelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 2 },
  savedCardLabel: { fontFamily: fontFamily.bold, fontSize: 13, color: colors.text.primary },
  defaultBadge: { backgroundColor: colors.primary.yellowLight, borderRadius: borderRadius.sm, paddingHorizontal: 6, paddingVertical: 1 },
  defaultBadgeText: { fontFamily: fontFamily.medium, fontSize: 11, color: colors.primary.yellowDark },
  savedCardStreet: { fontFamily: fontFamily.medium, fontSize: 14, color: colors.text.primary },
  savedCardDetail: { fontFamily: fontFamily.regular, fontSize: 13, color: colors.text.secondary, marginTop: 2 },
  savedCardPhone: { fontFamily: fontFamily.regular, fontSize: 12, color: colors.text.light, marginTop: 2 },
  savedCardActions: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  divider: { height: 1, backgroundColor: colors.border.light, marginVertical: spacing.lg },
  addNewLabel: { fontFamily: fontFamily.bold, fontSize: 16, color: colors.text.primary, marginBottom: spacing.md },
  labelRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  labelChip: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: borderRadius.pill, backgroundColor: colors.border.light },
  labelChipActive: { backgroundColor: colors.primary.yellow },
  labelChipText: { fontFamily: fontFamily.medium, fontSize: 13, color: colors.text.secondary },
  labelChipTextActive: { color: colors.text.onPrimary },
  spacer: { height: spacing.lg },
  row: { flexDirection: 'row', gap: spacing.md },
  halfInput: { flex: 1 },
  fieldLabel: { fontFamily: fontFamily.medium, fontSize: 14, lineHeight: 20, color: colors.text.primary, marginBottom: spacing.sm },
  stateDropdown: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1.5, borderColor: colors.border.gray, borderRadius: borderRadius.lg, backgroundColor: colors.background.white, paddingHorizontal: spacing.md, height: 48 },
  stateDropdownError: { borderColor: colors.status.error },
  stateDropdownText: { fontFamily: fontFamily.regular, fontSize: 15, color: colors.text.primary, flex: 1 },
  statePlaceholder: { color: colors.text.light },
  errorText: { fontFamily: fontFamily.regular, fontSize: 12, color: colors.status.error, marginTop: spacing.xs },
  buttonWrap: { marginTop: spacing.xxxl },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: colors.background.white, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, paddingTop: spacing.md, paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl, maxHeight: '70%' },
  modalHandle: { width: 36, height: 4, backgroundColor: colors.border.gray, borderRadius: 2, alignSelf: 'center', marginBottom: spacing.md },
  modalTitle: { fontFamily: fontFamily.bold, fontSize: 17, color: colors.text.primary, marginBottom: spacing.md },
  stateOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border.light },
  stateOptionActive: { backgroundColor: colors.primary.yellowLight },
  stateOptionText: { fontFamily: fontFamily.regular, fontSize: 15, color: colors.text.primary },
  stateOptionTextActive: { fontFamily: fontFamily.medium },
  cityPromptWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxxl, gap: spacing.md },
  cityPromptText: { fontFamily: fontFamily.regular, fontSize: 14, color: colors.text.light, textAlign: 'center' },
});
