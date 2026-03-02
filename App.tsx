import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  FlatList,
  Image,
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type Property = {
  id: string;
  name: string;
  city: string;
  pricePerNight: number;
  slots: string[];
  photos: Array<string | number>;
  facilities: string[];
  map: {
    lat: number;
    lng: number;
    address: string;
  };
};

type Booking = {
  propertyId: string;
  propertyName: string;
  city: string;
  slot: string;
  guestName: string;
  guestPhone: string;
  nights: number;
  totalAmount: number;
  bookedAt: string;
};

const starterProperties: Property[] = [
  {
    id: 'p1',
    name: 'Radha Illam',
    city: 'Chennai',
    pricePerNight: 4500,
    slots: ['2026-03-10', '2026-03-11', '2026-03-12'],
    photos: [
      require('./assets/radha-illam/WhatsApp Image 2024-08-21 at 1.03.34 PM (1).jpeg'),
      require('./assets/radha-illam/WhatsApp Image 2024-08-21 at 1.03.34 PM (2).jpeg'),
      require('./assets/radha-illam/WhatsApp Image 2024-08-21 at 1.03.34 PM (4).jpeg'),
      require('./assets/radha-illam/WhatsApp Image 2024-08-21 at 1.03.35 PM (8).jpeg'),
      require('./assets/radha-illam/WhatsApp Image 2024-08-21 at 1.03.35 PM.jpeg'),
    ],
    facilities: ['2 Bedrooms', 'WiFi', 'Private Parking', 'Kitchen'],
    map: {
      lat: 13.0827,
      lng: 80.2707,
      address: "VJD's Mitra, 22, EB Colony 2nd St, Vel Nagar, Radha Nagar, Adambakkam, Chennai, Tamil Nadu 600042",
    },
  },
  {
    id: 'p2',
    name: 'Neithal Homes',
    city: 'Puducherry',
    pricePerNight: 7500,
    slots: ['2026-03-14', '2026-03-15', '2026-03-16'],
    photos: [
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1000&q=60',
      'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?auto=format&fit=crop&w=1000&q=60',
      'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?auto=format&fit=crop&w=1000&q=60',
    ],
    facilities: ['2 Bedrooms', 'WiFi', 'Kitchen', 'Family Friendly'],
    map: {
      lat: 11.9416,
      lng: 79.8083,
      address: 'No.31 Nehru bazzar Chinnasubbrayapillai street, Puducherry, 605001',
    },
  },
  {
    id: 'p3',
    name: 'Marutham Farms',
    city: 'Puducherry',
    pricePerNight: 4500,
    slots: ['2026-03-17', '2026-03-18', '2026-03-19'],
    photos: [
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1000&q=60',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1000&q=60',
      'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1000&q=60',
    ],
    facilities: ['Farm Stay', '2 Bedrooms', 'WiFi', 'Parking'],
    map: {
      lat: 11.893,
      lng: 79.786,
      address: 'Ariyankuppam, Puducherry',
    },
  },
  {
    id: 'p4',
    name: 'Kurunji Retreat',
    city: 'Kodaikkanal',
    pricePerNight: 15000,
    slots: ['2026-03-20', '2026-03-21', '2026-03-22'],
    photos: [
      'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=1000&q=60',
      'https://images.unsplash.com/photo-1505692952047-1a78307da8f2?auto=format&fit=crop&w=1000&q=60',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1000&q=60',
    ],
    facilities: ['3 Bedrooms', 'Mountain View', 'WiFi', 'Parking'],
    map: {
      lat: 10.2381,
      lng: 77.4892,
      address: 'Pethuparai Village, Villpatti, Kodaikkanal',
    },
  },
];

const mergeStarterProperties = (storedProperties: Property[]): Property[] => {
  const merged = new Map(starterProperties.map((property) => [property.id, property]));

  storedProperties.forEach((property) => {
    merged.set(property.id, property);
  });

  return Array.from(merged.values());
};

const cityIconPhotos: Record<string, string> = {
  Chennai:
    'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=200&q=60',
  Puducherry:
    'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=200&q=60',
  Kodaikkanal:
    'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?auto=format&fit=crop&w=200&q=60',
};

const defaultCityIconPhoto =
  'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=200&q=60';

const CONTACT_PHONE = '9945545880';
const CONTACT_INSTAGRAM_HANDLE = 'SeRaProps';
const CONTACT_ICONS = {
  phone: 'https://cdn-icons-png.flaticon.com/512/724/724664.png',
  whatsapp: 'https://cdn-icons-png.flaticon.com/512/733/733585.png',
  instagram: 'https://cdn-icons-png.flaticon.com/512/2111/2111463.png',
};

const faqs = [
  {
    question: 'What are the check-in and check-out times?',
    answer: 'Check-in is at 2:00 PM and check-out is at 12:00 PM.',
  },
  {
    question: 'Are the properties couple-friendly?',
    answer: 'Yes, couple-friendly stays are allowed with valid government ID proof.',
  },
  {
    question: 'Can I cancel or reschedule my booking?',
    answer: 'Please contact SeRa support for cancellation/reschedule requests; availability and terms may vary by slot.',
  },
  {
    question: 'Is early check-in or late check-out available?',
    answer: 'This is subject to property availability on that day. Contact support before your arrival date.',
  },
  {
    question: 'Are pets allowed in all properties?',
    answer: 'Pet policy may differ by property. Please confirm with SeRa support before booking.',
  },
  {
    question: 'What do I need at the time of check-in?',
    answer: 'Carry a valid government-issued ID and your booking details/phone number used during booking.',
  },
];

const STORAGE_KEYS = {
  properties: 'myestate_properties_v4',
  bookings: 'myestate_bookings_v1',
  selectedCity: 'myestate_selected_city_v4',
  selectedPropertyId: 'myestate_selected_property_id_v4',
};

export default function App() {
  const [properties, setProperties] = useState<Property[]>(starterProperties);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  const [selectedCity, setSelectedCity] = useState<string>('All Cities');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  const [selectedSlot, setSelectedSlot] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [nightsInput, setNightsInput] = useState('1');

  const cities = useMemo(() => {
    const unique = new Set(properties.map((property) => property.city));
    return ['All Cities', ...Array.from(unique).sort()];
  }, [properties]);

  const visibleProperties = useMemo(() => {
    if (selectedCity === 'All Cities') {
      return properties;
    }
    return properties.filter((property) => property.city === selectedCity);
  }, [properties, selectedCity]);

  const selectedProperty = useMemo(
    () => properties.find((property) => property.id === selectedPropertyId) ?? null,
    [properties, selectedPropertyId]
  );

  useEffect(() => {
    const hydrate = async () => {
      try {
        const [storedProperties, storedBookings, storedSelectedCity, storedSelectedPropertyId] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.properties),
          AsyncStorage.getItem(STORAGE_KEYS.bookings),
          AsyncStorage.getItem(STORAGE_KEYS.selectedCity),
          AsyncStorage.getItem(STORAGE_KEYS.selectedPropertyId),
        ]);
        const propertiesRaw = storedProperties;
        const bookingsRaw = storedBookings;
        const selectedCityRaw = storedSelectedCity;
        const selectedPropertyIdRaw = storedSelectedPropertyId;

        if (propertiesRaw) {
          const parsed = JSON.parse(propertiesRaw) as Property[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            setProperties(mergeStarterProperties(parsed));
          }
        }

        if (bookingsRaw) {
          const parsed = JSON.parse(bookingsRaw) as Booking[];
          if (Array.isArray(parsed)) {
            setBookings(parsed);
          }
        }

        if (selectedCityRaw && selectedCityRaw.trim()) {
          setSelectedCity(selectedCityRaw);
        }

        if (selectedPropertyIdRaw && selectedPropertyIdRaw.trim()) {
          setSelectedPropertyId(selectedPropertyIdRaw);
        }
      } catch (error) {
        console.warn('Failed to load local data', error);
      } finally {
        setIsHydrated(true);
      }
    };

    void hydrate();
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const persist = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEYS.properties, JSON.stringify(properties));
      } catch (error) {
        console.warn('Failed to save properties', error);
      }
    };

    void persist();
  }, [properties, isHydrated]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const persist = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEYS.bookings, JSON.stringify(bookings));
      } catch (error) {
        console.warn('Failed to save bookings', error);
      }
    };

    void persist();
  }, [bookings, isHydrated]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const persist = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEYS.selectedCity, selectedCity);
      } catch (error) {
        console.warn('Failed to save selected city', error);
      }
    };

    void persist();
  }, [selectedCity, isHydrated]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const persist = async () => {
      try {
        if (selectedPropertyId) {
          await AsyncStorage.setItem(STORAGE_KEYS.selectedPropertyId, selectedPropertyId);
        } else {
          await AsyncStorage.removeItem(STORAGE_KEYS.selectedPropertyId);
        }
      } catch (error) {
        console.warn('Failed to save selected property view', error);
      }
    };

    void persist();
  }, [selectedPropertyId, isHydrated]);

  useEffect(() => {
    if (!selectedPropertyId) {
      return;
    }

    const exists = properties.some((property) => property.id === selectedPropertyId);
    if (!exists) {
      setSelectedPropertyId(null);
    }
  }, [properties, selectedPropertyId]);

  const openProperty = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    setSelectedSlot('');
    setGuestName('');
    setGuestPhone('');
    setNightsInput('1');
  };

  const openMap = (property: Property) => {
    const exactQuery = property.map.address?.trim()
      ? encodeURIComponent(property.map.address)
      : `${property.map.lat},${property.map.lng}`;
    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${exactQuery}`;
    void Linking.openURL(mapUrl);
  };

  const openPhone = () => {
    void Linking.openURL(`tel:${CONTACT_PHONE}`);
  };

  const openWhatsApp = () => {
    void Linking.openURL(`https://wa.me/91${CONTACT_PHONE}`);
  };

  const openInstagram = () => {
    void Linking.openURL(`https://instagram.com/${CONTACT_INSTAGRAM_HANDLE}`);
  };

  const parseSlotDate = (value: string) => {
    const parsed = new Date(`${value}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const formatDisplayDate = (value: Date | null) => {
    if (!value) {
      return 'N/A';
    }
    return value.toLocaleDateString();
  };

  const calculateCheckoutDate = (slot: string, nights: number) => {
    const checkIn = parseSlotDate(slot);
    if (!checkIn) {
      return null;
    }

    const checkout = new Date(checkIn);
    checkout.setDate(checkout.getDate() + Math.max(1, nights));
    return checkout;
  };

  const submitBooking = () => {
    if (!selectedProperty || !selectedSlot || !guestName.trim() || !guestPhone.trim()) {
      return;
    }

    const nights = Math.max(1, Number(nightsInput) || 1);
    const totalAmount = nights * selectedProperty.pricePerNight;

    setBookings((previous) => [
      {
        propertyId: selectedProperty.id,
        propertyName: selectedProperty.name,
        city: selectedProperty.city,
        slot: selectedSlot,
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim(),
        nights,
        totalAmount,
        bookedAt: new Date().toLocaleString(),
      },
      ...previous,
    ]);

    setProperties((previous) =>
      previous.map((item) =>
        item.id === selectedProperty.id
          ? { ...item, slots: item.slots.filter((value) => value !== selectedSlot) }
          : item
      )
    );

    setSelectedSlot('');
    setGuestName('');
    setGuestPhone('');
    setNightsInput('1');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView style={styles.screen} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.appTitle}>SeRa Properties</Text>
        <Text style={styles.subtitle}>The Radha Selvaraj Properties</Text>

        {selectedProperty ? (
          <View style={styles.panel}>
            <Pressable style={styles.backButton} onPress={() => setSelectedPropertyId(null)}>
              <Text style={styles.backButtonText}>← Back to Property List</Text>
            </Pressable>

            <Text style={styles.detailTitle}>{selectedProperty.name}</Text>
            <Text style={styles.propertyMeta}>{selectedProperty.city}</Text>
            <Text style={styles.propertyPrice}>₹{selectedProperty.pricePerNight} / night</Text>

            <Text style={styles.sectionTitle}>Google Map Location</Text>
            <Text style={styles.mapAddress}>{selectedProperty.map.address}</Text>
            <Pressable style={styles.mapButton} onPress={() => openMap(selectedProperty)}>
              <Text style={styles.mapButtonText}>Open in Google Maps</Text>
            </Pressable>

            <Text style={styles.sectionTitle}>Photos</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoRow}>
              {selectedProperty.photos.map((photo, index) => (
                <Image
                  key={`${selectedProperty.id}-photo-${index}`}
                  source={typeof photo === 'string' ? { uri: photo } : photo}
                  style={styles.photo}
                />
              ))}
            </ScrollView>

            <Text style={styles.sectionTitle}>Facilities</Text>
            <View style={styles.facilityWrap}>
              {selectedProperty.facilities.map((facility) => (
                <View key={facility} style={styles.facilityChip}>
                  <Text style={styles.facilityText}>{facility}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Slot Booking Form</Text>
            <Text style={styles.slotHeading}>Select Slot</Text>
            {selectedProperty.slots.length === 0 ? (
              <Text style={styles.noSlots}>No slots available</Text>
            ) : (
              <View style={styles.slotWrap}>
                {selectedProperty.slots.map((slot) => {
                  const isSelected = slot === selectedSlot;
                  return (
                    <Pressable
                      key={`${selectedProperty.id}-${slot}`}
                      style={[styles.slotButton, isSelected && styles.slotButtonSelected]}
                      onPress={() => setSelectedSlot(slot)}
                    >
                      <Text style={[styles.slotButtonText, isSelected && styles.slotButtonTextSelected]}>{slot}</Text>
                    </Pressable>
                  );
                })}
              </View>
            )}

            <TextInput
              style={styles.input}
              placeholder="Guest name"
              value={guestName}
              onChangeText={setGuestName}
            />
            <TextInput
              style={styles.input}
              placeholder="Phone number"
              value={guestPhone}
              onChangeText={setGuestPhone}
              keyboardType="phone-pad"
            />
            <TextInput
              style={styles.input}
              placeholder="Nights"
              value={nightsInput}
              onChangeText={setNightsInput}
              keyboardType="numeric"
            />

            <Pressable style={styles.primaryButton} onPress={submitBooking}>
              <Text style={styles.primaryButtonText}>Book Property</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Browse SeRa Properties by City</Text>
              <FlatList
                horizontal
                data={cities}
                keyExtractor={(item) => item}
                contentContainerStyle={styles.cityFilterRow}
                renderItem={({ item }) => {
                  const selected = item === selectedCity;
                  return (
                    <Pressable
                      style={[styles.chip, selected && styles.chipSelected]}
                      onPress={() => setSelectedCity(item)}
                    >
                      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{item}</Text>
                    </Pressable>
                  );
                }}
              />

              {visibleProperties.map((property) => {
                const cityIconPhoto = cityIconPhotos[property.city] ?? defaultCityIconPhoto;
                const stackPhotos = property.photos.length > 0 ? property.photos : [cityIconPhoto];

                return (
                  <View key={property.id} style={styles.propertyWrapper}>
                    <Pressable style={styles.propertyCard} onPress={() => openProperty(property.id)}>
                      <View style={styles.propertyHeader}>
                        <View>
                          <View style={styles.nameRow}>
                            <Text style={styles.propertyName}>{property.name}</Text>
                            <View style={styles.thumbStack}>
                              {stackPhotos.map((photo, photoIndex) => (
                                <Image
                                  key={`${property.id}-stack-${photoIndex}`}
                                  source={typeof photo === 'string' ? { uri: photo } : photo}
                                  style={[styles.nameThumb, photoIndex > 0 && styles.nameThumbOverlap]}
                                />
                              ))}
                            </View>
                          </View>
                          <View style={styles.cityRow}>
                            <Image source={{ uri: cityIconPhoto }} style={styles.cityIcon} />
                            <Text style={styles.propertyMeta}>{property.city}</Text>
                          </View>
                          <Text style={styles.propertyPrice}>₹{property.pricePerNight} / night</Text>
                          <Text style={styles.tapHint}>Tap to view details</Text>
                        </View>
                      </View>
                    </Pressable>
                  </View>
                );
              })}
            </View>

            <View style={styles.panel}>
              <Text style={styles.panelTitle}>My Bookings</Text>
              {bookings.length === 0 ? (
                <Text style={styles.noSlots}>No bookings yet</Text>
              ) : (
                bookings.slice(0, 8).map((booking, index) => {
                  const checkInDate = parseSlotDate(booking.slot);
                  const checkoutDate = calculateCheckoutDate(booking.slot, booking.nights);

                  return (
                    <View key={`${booking.propertyId}-${booking.slot}-${index}`} style={styles.bookingRow}>
                      <Text style={styles.bookingName}>{booking.propertyName}</Text>
                      <Text style={styles.bookingMeta}>{booking.city}</Text>
                      <Text style={styles.bookingMeta}>Guest: {booking.guestName}</Text>
                      <Text style={styles.bookingMeta}>Stay: {booking.nights} night(s) • ₹{booking.totalAmount}</Text>
                      <Text style={styles.bookingMeta}>Check-in: {formatDisplayDate(checkInDate)}</Text>
                      <Text style={styles.bookingMeta}>Check-out: {formatDisplayDate(checkoutDate)}</Text>
                      <Text style={styles.bookingTime}>Booked on: {booking.bookedAt}</Text>
                    </View>
                  );
                })
              )}
            </View>

            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Contact</Text>
              <Pressable style={styles.contactRow} onPress={openPhone}>
                <Image source={{ uri: CONTACT_ICONS.phone }} style={styles.contactIconImage} />
                <Text style={styles.contactText}>{CONTACT_PHONE}</Text>
              </Pressable>
              <Pressable style={styles.contactRow} onPress={openWhatsApp}>
                <Image source={{ uri: CONTACT_ICONS.whatsapp }} style={styles.contactIconImage} />
                <Text style={styles.contactText}>WhatsApp: {CONTACT_PHONE}</Text>
              </Pressable>
              <Pressable style={styles.contactRow} onPress={openInstagram}>
                <Image source={{ uri: CONTACT_ICONS.instagram }} style={styles.contactIconImage} />
                <Text style={styles.contactText}>Instagram: @{CONTACT_INSTAGRAM_HANDLE}</Text>
              </Pressable>
            </View>

            <View style={styles.panel}>
              <Text style={styles.panelTitle}>FAQs</Text>
              {faqs.map((item) => (
                <View key={item.question} style={styles.faqRow}>
                  <Text style={styles.faqQuestion}>Q. {item.question}</Text>
                  <Text style={styles.faqAnswer}>A. {item.answer}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f7fb',
  },
  screen: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
    gap: 14,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 2,
  },
  panel: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10,
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  primaryButton: {
    backgroundColor: '#1d4ed8',
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  backButtonText: {
    color: '#1e293b',
    fontWeight: '600',
    fontSize: 13,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 2,
  },
  mapAddress: {
    color: '#334155',
    fontSize: 13,
  },
  mapButton: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#93c5fd',
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  mapButtonText: {
    color: '#1d4ed8',
    fontWeight: '600',
    fontSize: 13,
  },
  photoRow: {
    gap: 8,
  },
  photo: {
    width: 210,
    height: 140,
    borderRadius: 10,
    backgroundColor: '#cbd5e1',
  },
  facilityWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  facilityChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#bae6fd',
    backgroundColor: '#ecfeff',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  facilityText: {
    color: '#155e75',
    fontSize: 12,
    fontWeight: '600',
  },
  cityFilterRow: {
    gap: 8,
    paddingBottom: 4,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  chipSelected: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
  },
  chipText: {
    color: '#334155',
    fontSize: 13,
  },
  chipTextSelected: {
    color: '#1e3a8a',
    fontWeight: '600',
  },
  propertyWrapper: {
    gap: 8,
  },
  propertyCard: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 10,
    gap: 8,
  },
  propertyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  propertyName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  thumbStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nameThumb: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#cbd5e1',
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  nameThumbOverlap: {
    marginLeft: -8,
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cityIcon: {
    width: 16,
    height: 16,
    borderRadius: 999,
    backgroundColor: '#cbd5e1',
  },
  propertyMeta: {
    fontSize: 13,
    color: '#475569',
  },
  propertyPrice: {
    fontSize: 14,
    color: '#166534',
    fontWeight: '600',
  },
  tapHint: {
    marginTop: 4,
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '600',
  },
  slotHeading: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },
  slotWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotButton: {
    borderRadius: 7,
    backgroundColor: '#ecfeff',
    borderWidth: 1,
    borderColor: '#67e8f9',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  slotButtonText: {
    color: '#0e7490',
    fontSize: 12,
    fontWeight: '600',
  },
  slotButtonSelected: {
    backgroundColor: '#dbeafe',
    borderColor: '#60a5fa',
  },
  slotButtonTextSelected: {
    color: '#1e3a8a',
  },
  noSlots: {
    color: '#64748b',
    fontSize: 13,
  },
  bookingRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 8,
    gap: 2,
  },
  bookingName: {
    fontWeight: '600',
    color: '#0f172a',
  },
  bookingMeta: {
    color: '#334155',
    fontSize: 12,
  },
  bookingTime: {
    color: '#64748b',
    fontSize: 11,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  contactIconImage: {
    width: 18,
    height: 18,
    borderRadius: 4,
  },
  contactText: {
    color: '#1d4ed8',
    fontWeight: '600',
    fontSize: 13,
  },
  faqRow: {
    gap: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 8,
    marginBottom: 2,
  },
  faqQuestion: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 13,
  },
  faqAnswer: {
    color: '#334155',
    fontSize: 12,
  },
});
