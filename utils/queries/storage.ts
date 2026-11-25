import { createClient } from "@/utils/supabase/component"
import { getAuthUserId } from '@/utils/queries/users'

export async function uploadUserFile(file: File, bucket?: string | null): Promise<{ url: string | null, error:string | null }> {
  if (file.size > 3 * 1024 * 1024) {
		return { url:null, error:"Image must be under 3MB." }
	}

  const userId = await getAuthUserId();
  if(!userId){
    return { url:null, error:"User not Authenticated." }
  }

  const supabase = createClient();

  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
  
  const filePath = `${userId}/${fileName}` 

  const { error: uploadError } = await supabase.storage
      .from(bucket ?? 'post_images')
      .upload(filePath, file)

  if(uploadError){
    return { url: null, error: uploadError.message }
  }

  // Get the public URL from the bucket
  const { data } = supabase.storage
      .from(bucket ?? 'post_images')
      .getPublicUrl(filePath)

  return { url: data.publicUrl, error: null }
}

export async function uploadCommunityFile(file: File, communityId: string, type: 'banner' | 'icon', bucket?: string | null): Promise<{ url: string | null, error:string | null}> {
  if (file.size > 3 * 1024 * 1024) {
		return { url:null, error:"Image must be under 3MB." }
	}

  const userId = await getAuthUserId();
  if(!userId){
    return { url:null, error:"User not Authenticated." }
  }

  const supabase = createClient();

  const filePath = `${communityId}/${type}`

  const { error: uploadError } = await supabase.storage
      .from(bucket ?? 'community_assets')
      .upload(filePath, file, { upsert: true })

  if(uploadError){
    return { url: null, error: uploadError.message }
  }

  // Get the public URL from the bucket
  const { data } = supabase.storage
      .from(bucket ?? 'community_assets')
      .getPublicUrl(filePath)

  const publicUrl = `${data.publicUrl}?t=${Date.now()}`

  const updatePayload = type === 'banner' ? { banner_url: publicUrl } : { icon_url: publicUrl }
		
		const { error: dbError } = await supabase
			.from('communities')
			.update(updatePayload)
			.eq('id', communityId)

  return { url: publicUrl, error: dbError ? dbError.message : null }
}
