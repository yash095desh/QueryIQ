import { prisma } from '@/lib/prisma'
import { verifyWebhook } from '@clerk/nextjs/webhooks'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const evt = await verifyWebhook(req)

    const { type, data } = evt

    if (type === 'user.created') {
      const { id, email_addresses, first_name, last_name, image_url } = data

      const email = email_addresses?.[0]?.email_address

      await prisma.user.upsert({
        where: { clerkId: id },
        update: {
          email,
          firstName: first_name || '',
          lastName: last_name || '',
          imageUrl: image_url || '',
        },
        create: {
          clerkId: id,
          email,
          firstName: first_name || '',
          lastName: last_name || '',
          imageUrl: image_url || '',
        },
      })

      console.log(' User created in database:', email)
    }


    if (type === 'user.updated') {
      const { id, email_addresses, first_name, last_name, image_url } = data

      const email = email_addresses?.[0]?.email_address

      await prisma.user.update({
        where: { clerkId: id },
        data: {
          email,
          firstName: first_name || '',
          lastName: last_name || '',
          imageUrl: image_url || '',
        },
      })

      console.log(' User updated in database:', email)
    }

    return new Response('Webhook processed successfully', { status: 200 })
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error verifying webhook', { status: 400 })
  }
}