import supabase from '../config/supabaseClient';

const STORAGE_BUCKETS = {
  taskPhotos: 'task-photos',
  checklistPhotos: 'checklist-photos',
};

const withErrorHandling = async (promise, defaultMessage) => {
  const { data, error } = await promise;

  if (error) {
    console.error(defaultMessage, error);
    throw new Error(error.message || defaultMessage);
  }

  return data;
};

// Função para obter o organization_id do usuário logado
export const getCurrentUserOrganizationId = async () => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    console.log('[getCurrentUserOrganizationId] ========== INICIO ==========');
    console.log('[getCurrentUserOrganizationId] userError:', userError);
    console.log('[getCurrentUserOrganizationId] user:', user ? user.id : 'NULL');

    if (userError || !user) {
      console.log('[getCurrentUserOrganizationId] Usuário não logado ou erro');
      return null;
    }

    console.log('[getCurrentUserOrganizationId] user.user_metadata:', JSON.stringify(user.user_metadata));

    // Tenta primeiro do user_metadata (mais rápido)
    if (user.user_metadata?.organization_id) {
      console.log('[getCurrentUserOrganizationId] Retornando do metadata:', user.user_metadata.organization_id);
      return user.user_metadata.organization_id;
    }

    // Se não tiver, busca do profile
    console.log('[getCurrentUserOrganizationId] Buscando do profile para user.id:', user.id);

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    console.log('[getCurrentUserOrganizationId] profileError:', profileError);
    console.log('[getCurrentUserOrganizationId] profile:', JSON.stringify(profile));

    const orgId = profile?.organization_id || null;
    console.log('[getCurrentUserOrganizationId] organization_id final:', orgId);
    console.log('[getCurrentUserOrganizationId] ========== FIM ==========');

    return orgId;
  } catch (err) {
    console.log('[getCurrentUserOrganizationId] ERRO CATCH:', err);
    return null;
  }
};

const guessContentType = (uri) => {
  if (!uri) return 'image/jpeg';
  const extension = uri.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'png':
      return 'image/png';
    case 'heic':
      return 'image/heic';
    case 'webp':
      return 'image/webp';
    case 'jpg':
    case 'jpeg':
    default:
      return 'image/jpeg';
  }
};

export const listAnimalsByEnclosure = async (enclosureId) => {
  const orgId = await getCurrentUserOrganizationId();
  let query = supabase
    .from('animals')
    .select(
      `
      *,
      species:species_id (
        id,
        common_name
      ),
      enclosure:current_enclosure_id (
        id,
        name
      )
    `
    )
    .eq('current_enclosure_id', enclosureId)
    .order('name', { ascending: true });

  if (orgId) {
    query = query.eq('organization_id', orgId);
  }

  return withErrorHandling(query, 'Falha ao carregar os animais do recinto.');
};

const uploadMedia = async ({ uri, bucket, prefix }) => {
  if (!uri) return null;

  const fileExt = uri.split('.').pop() || 'jpg';
  const fileName = `${prefix || 'upload'}-${Date.now()}-${Math.round(Math.random() * 1e6)}.${fileExt}`;
  const contentType = guessContentType(uri);

  const response = await fetch(uri);
  const blob = await response.blob();

  const publicUrl = await withErrorHandling(
    supabase.storage.from(bucket).upload(fileName, blob, {
      contentType,
      upsert: true,
    }),
    'Falha ao enviar arquivo para o armazenamento.'
  );

  const { data } = supabase.storage.from(bucket).getPublicUrl(publicUrl?.path || fileName);

  return data?.publicUrl || null;
};

// -----------------------------------------------------------------------------
// Áreas
// -----------------------------------------------------------------------------

export const listAreas = async () => {
  const orgId = await getCurrentUserOrganizationId();
  let query = supabase.from('areas').select('*').order('name', { ascending: true });

  if (orgId) {
    query = query.eq('organization_id', orgId);
  }

  return withErrorHandling(query, 'Falha ao carregar as áreas.');
};

export const createArea = async (payload) => {
  const orgId = await getCurrentUserOrganizationId();
  return withErrorHandling(
    supabase.from('areas').insert([{ ...payload, organization_id: orgId }]).select().single(),
    'Não foi possível criar a área.'
  );
};

export const updateArea = async (id, payload) =>
  withErrorHandling(
    supabase.from('areas').update({ ...payload }).eq('id', id).select().single(),
    'Não foi possível atualizar a área.'
  );

export const deleteArea = async (id) =>
  withErrorHandling(
    supabase.from('areas').delete().eq('id', id),
    'Não foi possível remover a área.'
  );

// -----------------------------------------------------------------------------
// Recintos
// -----------------------------------------------------------------------------

export const listEnclosures = async () => {
  const orgId = await getCurrentUserOrganizationId();
  let query = supabase
    .from('enclosures')
    .select('*, area:area_id (id, name)')
    .order('name', { ascending: true });

  if (orgId) {
    query = query.eq('organization_id', orgId);
  }

  return withErrorHandling(query, 'Falha ao carregar os recintos.');
};

export const createEnclosure = async (payload) => {
  const orgId = await getCurrentUserOrganizationId();
  return withErrorHandling(
    supabase.from('enclosures').insert([{ ...payload, organization_id: orgId }]).select().single(),
    'Não foi possível criar o recinto.'
  );
};

export const updateEnclosure = async (id, payload) =>
  withErrorHandling(
    supabase.from('enclosures').update({ ...payload }).eq('id', id).select().single(),
    'Não foi possível atualizar o recinto.'
  );

export const deleteEnclosure = async (id) =>
  withErrorHandling(
    supabase.from('enclosures').delete().eq('id', id),
    'Não foi possível remover o recinto.'
  );

export const updateEnclosureLocation = async (id, latitude, longitude) =>
  withErrorHandling(
    supabase
      .from('enclosures')
      .update({ latitude, longitude })
      .eq('id', id)
      .select('*, area:area_id (id, name)')
      .single(),
    'Não foi possível atualizar a localização do recinto.'
  );

export const listEnclosuresWithLocation = async () => {
  const orgId = await getCurrentUserOrganizationId();
  let query = supabase
    .from('enclosures')
    .select('*, area:area_id (id, name)')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
    .order('name', { ascending: true });

  if (orgId) {
    query = query.eq('organization_id', orgId);
  }

  return withErrorHandling(query, 'Falha ao carregar os recintos com localização.');
};

// -----------------------------------------------------------------------------
// Espécies
// -----------------------------------------------------------------------------

export const listSpecies = async () => {
  const orgId = await getCurrentUserOrganizationId();
  let query = supabase.from('species').select('*').order('common_name', { ascending: true });

  if (orgId) {
    query = query.eq('organization_id', orgId);
  }

  return withErrorHandling(query, 'Falha ao carregar as espécies.');
};

export const createSpecies = async (payload) => {
  const orgId = await getCurrentUserOrganizationId();
  return withErrorHandling(
    supabase.from('species').insert([{ ...payload, organization_id: orgId }]).select().single(),
    'Não foi possível criar a espécie.'
  );
};

export const updateSpecies = async (id, payload) =>
  withErrorHandling(
    supabase.from('species').update({ ...payload }).eq('id', id).select().single(),
    'Não foi possível atualizar a espécie.'
  );

export const deleteSpecies = async (id) =>
  withErrorHandling(
    supabase.from('species').delete().eq('id', id),
    'Não foi possível remover a espécie.'
  );

// -----------------------------------------------------------------------------
// Animais
// -----------------------------------------------------------------------------

export const listAnimals = async () => {
  const orgId = await getCurrentUserOrganizationId();
  let query = supabase
    .from('animals')
    .select(
      `
      *,
      species:species_id (
        id,
        common_name,
        scientific_name,
        conservation_status
      ),
      enclosure:current_enclosure_id (
        id,
        name,
        code,
        area_id
      )
    `
    )
    .order('name', { ascending: true });

  if (orgId) {
    query = query.eq('organization_id', orgId);
  }

  return withErrorHandling(query, 'Falha ao carregar os animais.');
};

export const createAnimal = async (payload) => {
  const { photoUri, ...rest } = payload;
  let photoUrl = payload.photo_url || null;
  const orgId = await getCurrentUserOrganizationId();

  console.log('[createAnimal] organization_id a ser usado:', orgId);

  if (photoUri) {
    photoUrl = await uploadMedia({
      uri: photoUri,
      bucket: STORAGE_BUCKETS.taskPhotos,
      prefix: 'animal',
    });
  }

  const insertData = { ...rest, photo_url: photoUrl, organization_id: orgId };
  console.log('[createAnimal] Dados a inserir:', JSON.stringify(insertData));

  return withErrorHandling(
    supabase
      .from('animals')
      .insert([insertData])
      .select(
        `
        *,
        species:species_id (*),
        enclosure:current_enclosure_id (*)
      `
      )
      .single(),
    'Não foi possível cadastrar o animal.'
  );
};

export const updateAnimal = async (id, payload) => {
  const { photoUri, removePhoto, ...rest } = payload;
  let nextPayload = { ...rest };

  if (photoUri) {
    const photoUrl = await uploadMedia({
      uri: photoUri,
      bucket: STORAGE_BUCKETS.taskPhotos,
      prefix: 'animal',
    });
    nextPayload.photo_url = photoUrl;
  } else if (removePhoto) {
    nextPayload.photo_url = null;
  }

  return withErrorHandling(
    supabase
      .from('animals')
      .update(nextPayload)
      .eq('id', id)
      .select(
        `
        *,
        species:species_id (*),
        enclosure:current_enclosure_id (*)
      `
      )
      .single(),
    'Não foi possível atualizar o animal.'
  );
};

export const deleteAnimal = async (id) =>
  withErrorHandling(
    supabase.from('animals').delete().eq('id', id),
    'Não foi possível remover o animal.'
  );

export const moveAnimal = async ({ animalId, destinationEnclosureId, notes }) => {
  const animal = await withErrorHandling(
    supabase
      .from('animals')
      .select('id, current_enclosure_id')
      .eq('id', animalId)
      .single(),
    'Não foi possível localizar o animal para movimentação.'
  );

  const fromEnclosureId = animal?.current_enclosure_id ?? null;

  const updatedAnimal = await withErrorHandling(
    supabase
      .from('animals')
      .update({ current_enclosure_id: destinationEnclosureId })
      .eq('id', animalId)
      .select(
        `
        *,
        species:species_id (*),
        enclosure:current_enclosure_id (*)
      `
      )
      .single(),
    'Não foi possível atualizar o recinto do animal.'
  );

  await withErrorHandling(
    supabase.from('animal_enclosure_history').insert([
      {
        animal_id: animalId,
        from_enclosure_id: fromEnclosureId,
        to_enclosure_id: destinationEnclosureId,
        notes: notes || null,
      },
    ]),
    'Não foi possível registrar o histórico de movimentação.'
  );

  return updatedAnimal;
};

export const listAnimalHistory = async () =>
  withErrorHandling(
    supabase
      .from('animal_enclosure_history')
      .select(
        `
        *,
        animal:animal_id (
          id,
          name,
          identifier
        ),
        from_enclosure:from_enclosure_id (
          id,
          name
        ),
        to_enclosure:to_enclosure_id (
          id,
          name
        )
      `
      )
      .order('moved_at', { ascending: false })
      .limit(100),
    'Falha ao carregar o histórico de recintos.'
  );

// -----------------------------------------------------------------------------
// Templates de Checklist
// -----------------------------------------------------------------------------

export const listChecklistTemplates = async () => {
  const orgId = await getCurrentUserOrganizationId();
  let query = supabase
    .from('checklist_templates')
    .select(
      `
      *,
      items:checklist_template_items (
        id,
        description,
        requires_photo,
        sort_order,
        instructions
      )
    `
    )
    .order('title', { ascending: true });

  if (orgId) {
    query = query.eq('organization_id', orgId);
  }

  return withErrorHandling(query, 'Falha ao carregar os templates de checklist.');
};

export const createChecklistTemplate = async (payload) => {
  const { items = [], ...template } = payload;
  const orgId = await getCurrentUserOrganizationId();

  const createdTemplate = await withErrorHandling(
    supabase.from('checklist_templates').insert([{ ...template, organization_id: orgId }]).select().single(),
    'Não foi possível criar o template de checklist.'
  );

  if (items.length > 0) {
    await withErrorHandling(
      supabase.from('checklist_template_items').insert(
        items.map((item, index) => ({
          ...item,
          template_id: createdTemplate.id,
          sort_order: item.sort_order ?? index,
        }))
      ),
      'Não foi possível adicionar os itens do template.'
    );
  }

  return listChecklistTemplateById(createdTemplate.id);
};

export const listChecklistTemplateById = async (id) =>
  withErrorHandling(
    supabase
      .from('checklist_templates')
      .select(
        `
        *,
        items:checklist_template_items (
          id,
          description,
          requires_photo,
          sort_order,
          instructions
        )
      `
      )
      .eq('id', id)
      .single(),
    'Não foi possível carregar o template de checklist.'
  );

export const updateChecklistTemplate = async (id, payload) => {
  const { items = [], removedItemIds = [], ...template } = payload;

  const updatedTemplate = await withErrorHandling(
    supabase.from('checklist_templates').update(template).eq('id', id).select().single(),
    'Não foi possível atualizar o template.'
  );

  const operations = [];

  if (removedItemIds.length > 0) {
    operations.push(
      withErrorHandling(
        supabase.from('checklist_template_items').delete().in('id', removedItemIds),
        'Não foi possível remover itens do template.'
      )
    );
  }

  if (items.length > 0) {
    operations.push(
      withErrorHandling(
        supabase.from('checklist_template_items').upsert(
          items.map((item, index) => ({
            ...item,
            template_id: id,
            sort_order: item.sort_order ?? index,
          })),
          { onConflict: 'id' }
        ),
        'Não foi possível atualizar os itens do template.'
      )
    );
  }

  if (operations.length > 0) {
    await Promise.all(operations);
  }

  return listChecklistTemplateById(updatedTemplate.id);
};

export const deleteChecklistTemplate = async (id) =>
  withErrorHandling(
    supabase.from('checklist_templates').delete().eq('id', id),
    'Não foi possível remover o template.'
  );

// -----------------------------------------------------------------------------
// Execução de Checklists
// -----------------------------------------------------------------------------

export const listChecklists = async ({ performedBy }) => {
  const orgId = await getCurrentUserOrganizationId();
  let query = supabase
    .from('checklists')
    .select(
      `
      *,
      performer:profiles!checklists_performed_by_fkey (
        id,
        email
      ),
      template:template_id (
        id,
        title,
        frequency
      ),
      items:checklist_items (
        id,
        status,
        photo_url,
        remarks,
        template_item_id
      )
    `
    )
    .order('performed_at', { ascending: false });

  if (orgId) {
    query = query.eq('organization_id', orgId);
  }

  if (performedBy) {
    query = query.eq('performed_by', performedBy);
  }

  return withErrorHandling(query, 'Falha ao carregar os checklists executados.');
};

export const createChecklistExecution = async ({
  templateId,
  performedBy,
  enclosureId,
  speciesId,
  notes,
  items,
}) => {
  const orgId = await getCurrentUserOrganizationId();
  const created = await withErrorHandling(
    supabase
      .from('checklists')
      .insert([
        {
          template_id: templateId,
          performed_by: performedBy,
          enclosure_id: enclosureId || null,
          species_id: speciesId || null,
          notes: notes || null,
          organization_id: orgId,
        },
      ])
      .select()
      .single(),
    'Não foi possível registrar o checklist.'
  );

  if (items?.length) {
    const preparedItems = await Promise.all(
      items.map(async (item) => {
        let photoUrl = item.photo_url || null;

        if (item.photoUri) {
          photoUrl = await uploadMedia({
            uri: item.photoUri,
            bucket: STORAGE_BUCKETS.checklistPhotos,
            prefix: 'checklist',
          });
        }

        return {
          checklist_id: created.id,
          template_item_id: item.template_item_id,
          status: item.status,
          remarks: item.remarks || null,
          photo_url: photoUrl,
        };
      })
    );

    await withErrorHandling(
      supabase.from('checklist_items').insert(preparedItems),
      'Não foi possível registrar os itens do checklist.'
    );
  }

  return created;
};

// -----------------------------------------------------------------------------
// Tarefas
// -----------------------------------------------------------------------------

export const listTasks = async ({ assignedTo, status }) => {
  let query = supabase
    .from('tasks')
    .select(
      `
      *,
      assigned_user:profiles!tasks_assigned_to_fkey (
        id,
        email
      ),
      creator:profiles!tasks_created_by_fkey (
        id,
        email
      ),
      enclosure:enclosure_id (
        id,
        name
      ),
      species:species_id (
        id,
        common_name
      ),
      template:checklist_template_id (
        id,
        title
      ),
      prerequisites:task_prerequisites!task_prerequisites_task_id_fkey (
        id,
        depends_on_task_id,
        dependency:depends_on_task_id (
          id,
          title,
          status
        )
      )
    `
    )
    .order('due_at', { ascending: true, nullsFirst: false });

  // Tarefas são filtradas por assigned_to (usuário responsável), não por organization_id
  if (assignedTo) {
    query = query.eq('assigned_to', assignedTo);
  }

  if (status) {
    query = query.eq('status', status);
  }

  return withErrorHandling(query, 'Falha ao carregar as tarefas.');
};

export const createTask = async (payload) => {
  const { photoUri, prerequisites = [], ...task } = payload;
  let completionPhotoUrl = task.completion_photo_url || null;
  const orgId = await getCurrentUserOrganizationId();

  if (photoUri) {
    completionPhotoUrl = await uploadMedia({
      uri: photoUri,
      bucket: STORAGE_BUCKETS.taskPhotos,
      prefix: 'task',
    });
  }

  const createdTask = await withErrorHandling(
    supabase
      .from('tasks')
      .insert([
        {
          ...task,
          completion_photo_url: completionPhotoUrl,
          organization_id: orgId,
        },
      ])
      .select()
      .single(),
    'Não foi possível criar a tarefa.'
  );

  if (prerequisites.length > 0) {
    await withErrorHandling(
      supabase.from('task_prerequisites').insert(
        prerequisites.map((depends_on_task_id) => ({
          task_id: createdTask.id,
          depends_on_task_id,
        }))
      ),
      'Não foi possível vincular os pré-requisitos da tarefa.'
    );
  }

  return listTaskById(createdTask.id);
};

export const listTaskById = async (id) =>
  withErrorHandling(
    supabase
      .from('tasks')
      .select(
        `
        *,
        assigned_user:profiles!tasks_assigned_to_fkey (
          id,
          email
        ),
        enclosure:enclosure_id (id, name),
        species:species_id (id, common_name),
        template:checklist_template_id (id, title),
        prerequisites:task_prerequisites!task_prerequisites_task_id_fkey (
          id,
          depends_on_task_id
        )
      `
      )
      .eq('id', id)
      .single(),
    'Não foi possível carregar a tarefa.'
  );

export const updateTask = async (id, payload) => {
  const { prerequisites = [], removedPrerequisiteIds = [], ...task } = payload;

  const updatedTask = await withErrorHandling(
    supabase.from('tasks').update(task).eq('id', id).select().single(),
    'Não foi possível atualizar a tarefa.'
  );

  if (removedPrerequisiteIds.length > 0) {
    await withErrorHandling(
      supabase.from('task_prerequisites').delete().in('id', removedPrerequisiteIds),
      'Não foi possível remover pré-requisitos da tarefa.'
    );
  }

  if (prerequisites.length > 0) {
    await withErrorHandling(
      supabase.from('task_prerequisites').upsert(
        prerequisites.map((prerequisite) => ({
          id: prerequisite.id,
          task_id: id,
          depends_on_task_id: prerequisite.depends_on_task_id,
        })),
        { onConflict: 'id' }
      ),
      'Não foi possível atualizar pré-requisitos da tarefa.'
    );
  }

  return listTaskById(updatedTask.id);
};

export const deleteTask = async (id) =>
  withErrorHandling(
    supabase.from('tasks').delete().eq('id', id),
    'Não foi possível remover a tarefa.'
  );

export const completeTask = async ({ taskId, completedBy, notes, photoUri }) => {
  let completionPhotoUrl = null;

  if (photoUri) {
    completionPhotoUrl = await uploadMedia({
      uri: photoUri,
      bucket: STORAGE_BUCKETS.taskPhotos,
      prefix: 'task-completion',
    });
  }

  await withErrorHandling(
    supabase
      .from('tasks')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        completed_by: completedBy,
        completion_notes: notes || null,
        completion_photo_url: completionPhotoUrl,
      })
      .eq('id', taskId),
    'Não foi possível concluir a tarefa.'
  );

  return listTaskById(taskId);
};

export const reopenTask = async (taskId) =>
  withErrorHandling(
    supabase
      .from('tasks')
      .update({
        status: 'pending',
        completed_at: null,
        completed_by: null,
        completion_notes: null,
        completion_photo_url: null,
      })
      .eq('id', taskId),
    'Não foi possível reabrir a tarefa.'
  );

export const listTaskPrerequisites = async (taskId) =>
  withErrorHandling(
    supabase
      .from('task_prerequisites')
      .select(
        `
        *,
        dependency:depends_on_task_id (
          id,
          title,
          status
        )
      `
      )
      .eq('task_id', taskId),
    'Não foi possível carregar os pré-requisitos.'
  );
