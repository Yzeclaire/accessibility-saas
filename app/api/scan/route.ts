import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url } = body

    // Validation de l'URL
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { success: false, error: 'URL requise' },
        { status: 400 }
      )
    }

    let validUrl: URL
    try {
      validUrl = new URL(url)
      // Vérifier que c'est http ou https
      if (!['http:', 'https:'].includes(validUrl.protocol)) {
        return NextResponse.json(
          { success: false, error: 'URL doit être http ou https' },
          { status: 400 }
        )
      }
    } catch {
      return NextResponse.json(
        { success: false, error: 'URL invalide' },
        { status: 400 }
      )
    }

    // Créer le scan dans Supabase
    const supabase = await createClient()
    const { data: scan, error } = await supabase
      .from('scans')
      .insert({
        url: validUrl.toString(),
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      console.error('Erreur Supabase:', error)
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la création du scan' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      scanId: scan.id,
    })
  } catch (error) {
    console.error('Erreur serveur:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

