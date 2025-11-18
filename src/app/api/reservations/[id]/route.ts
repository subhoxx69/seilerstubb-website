import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reservationId } = await params;

    if (!reservationId) {
      return NextResponse.json(
        { error: 'Reservierungs-ID erforderlich' },
        { status: 400 }
      );
    }

    const docRef = doc(db, 'reservations', reservationId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json(
        { error: 'Reservierung nicht gefunden' },
        { status: 404 }
      );
    }

    const data = docSnap.data();

    return NextResponse.json(
      {
        id: reservationId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        date: data.date,
        time: data.time,
        people: data.people,
        bereich: data.bereich,
        notes: data.notes || '',
        status: data.status,
        createdAt: data.createdAt?.toDate?.().toISOString() || new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching reservation:', error);
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Reservierung' },
      { status: 500 }
    );
  }
}
