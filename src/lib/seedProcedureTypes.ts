import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

export async function seedProcedureTypes(): Promise<void> {
  const col = collection(db, 'procedureTypes');
  const snap = await getDocs(col);
  if (!snap.empty) return;

  const types = [
    {
      code: 'RM',
      name: 'Solicitud de Registro de Marca',
      isActive: true,
      powerValidityYears: 5,
      requirements: [
        { id: 'rm-1', label: 'Poder firmado por Representante Legal', type: 'digital_signature', templateType: 'poder_simple', isRequired: true, order: 1, description: 'Vigencia de 5 años desde la fecha de firma' },
        { id: 'rm-2', label: 'Denominación de la marca', type: 'form_field', fieldKey: 'denominacion', isRequired: true, order: 2, placeholder: 'Ej: NOVA TECH' },
        { id: 'rm-3', label: 'Descripción del producto/servicio', type: 'form_field', fieldKey: 'descripcion', isRequired: true, order: 3, placeholder: 'Describa el producto o servicio a registrar' },
        { id: 'rm-4', label: 'Logo de la marca', type: 'document_upload', acceptedFormats: ['PDF', 'JPG', 'PNG'], validatedByAI: false, isRequired: true, order: 4, description: 'Suba el logo en alta resolución' },
        { id: 'rm-5', label: 'Colores del logo (si aplica)', type: 'form_field', fieldKey: 'colores_logo', isRequired: false, order: 5, placeholder: 'Ej: Pantone 286C, RGB 0-51-160, o N/A si es en blanco y negro' },
        { id: 'rm-6', label: 'Certificado de existencia y representación legal', type: 'document_upload', acceptedFormats: ['PDF'], validatedByAI: true, isRequired: true, order: 6 },
        { id: 'rm-7', label: 'País de trámite', type: 'form_field', fieldKey: 'pais', isRequired: true, order: 7, placeholder: 'Ej: Colombia, México, Chile' },
      ],
    },
    {
      code: 'REN',
      name: 'Solicitud Renovación de Registro de Marca',
      isActive: true,
      powerValidityYears: 5,
      requirements: [
        { id: 'ren-1', label: 'Poder firmado por Representante Legal', type: 'digital_signature', templateType: 'poder_simple', isRequired: true, order: 1, description: 'Vigencia de 5 años desde la fecha de firma' },
        { id: 'ren-2', label: 'Certificado de existencia y representación legal', type: 'document_upload', acceptedFormats: ['PDF'], validatedByAI: true, isRequired: true, order: 2 },
        { id: 'ren-3', label: 'Número de expediente o certificado', type: 'form_field', fieldKey: 'expediente', isRequired: true, order: 3, placeholder: 'Ej: REN-2024-0987' },
        { id: 'ren-4', label: 'País de trámite', type: 'form_field', fieldKey: 'pais', isRequired: true, order: 4, placeholder: 'Ej: Colombia' },
      ],
    },
    {
      code: 'BUSQ',
      name: 'Búsqueda de Antecedentes',
      isActive: true,
      powerValidityYears: 5,
      requirements: [
        { id: 'busq-1', label: 'Denominación de la marca', type: 'form_field', fieldKey: 'denominacion', isRequired: true, order: 1, placeholder: 'Marca a buscar' },
        { id: 'busq-2', label: 'Descripción del producto/servicio', type: 'form_field', fieldKey: 'descripcion', isRequired: true, order: 2, placeholder: 'Clase de Niza o descripción del producto' },
        { id: 'busq-3', label: 'País de trámite', type: 'form_field', fieldKey: 'pais', isRequired: true, order: 3, placeholder: 'Ej: Colombia' },
      ],
    },
    {
      code: 'PREC',
      name: 'Presentación Recurso',
      isActive: true,
      powerValidityYears: 5,
      requirements: [
        { id: 'prec-1', label: 'Poder firmado por Representante Legal', type: 'digital_signature', templateType: 'poder_simple', isRequired: true, order: 1, description: 'Vigencia de 5 años desde la fecha de firma' },
        { id: 'prec-2', label: 'Denominación de la marca', type: 'form_field', fieldKey: 'denominacion', isRequired: true, order: 2, placeholder: 'Nombre de la marca en disputa' },
        { id: 'prec-3', label: 'Número de expediente', type: 'form_field', fieldKey: 'expediente', isRequired: true, order: 3, placeholder: 'Ej: SC 2024-12345' },
        { id: 'prec-4', label: 'Copia del acto administrativo', type: 'document_upload', acceptedFormats: ['PDF'], validatedByAI: false, isRequired: true, order: 4 },
      ],
    },
    {
      code: 'CONTA',
      name: 'Contestación Auto',
      isActive: true,
      powerValidityYears: 5,
      requirements: [
        { id: 'conta-1', label: 'Poder firmado por Representante Legal', type: 'digital_signature', templateType: 'poder_simple', isRequired: true, order: 1, description: 'Vigencia de 5 años desde la fecha de firma' },
        { id: 'conta-2', label: 'Denominación de la marca', type: 'form_field', fieldKey: 'denominacion', isRequired: true, order: 2, placeholder: 'Nombre de la marca a contestar' },
        { id: 'conta-3', label: 'Número de expediente', type: 'form_field', fieldKey: 'expediente', isRequired: true, order: 3, placeholder: 'Ej: SC 2024-12345' },
        { id: 'conta-4', label: 'Copia del acto administrativo', type: 'document_upload', acceptedFormats: ['PDF'], validatedByAI: false, isRequired: true, order: 4 },
      ],
    },
    {
      code: 'OPORM',
      name: 'Oposición a Registro de Marca',
      isActive: true,
      powerValidityYears: 5,
      requirements: [
        { id: 'oporm-1', label: 'Poder firmado por Representante Legal', type: 'digital_signature', templateType: 'poder_simple', isRequired: true, order: 1, description: 'Vigencia de 5 años desde la fecha de firma' },
        { id: 'oporm-2', label: 'Denominación de la marca', type: 'form_field', fieldKey: 'denominacion', isRequired: true, order: 2, placeholder: 'Marca que se opone' },
        { id: 'oporm-3', label: 'Número de expediente', type: 'form_field', fieldKey: 'expediente', isRequired: true, order: 3, placeholder: 'Ej: SC 2024-12345' },
      ],
    },
    {
      code: 'RTAO',
      name: 'Respuesta a Oposición',
      isActive: true,
      powerValidityYears: 5,
      requirements: [
        { id: 'rtao-1', label: 'Poder firmado por Representante Legal', type: 'digital_signature', templateType: 'poder_simple', isRequired: true, order: 1, description: 'Vigencia de 5 años desde la fecha de firma' },
        { id: 'rtao-2', label: 'Denominación de la marca', type: 'form_field', fieldKey: 'denominacion', isRequired: true, order: 2, placeholder: 'Marca en oposición' },
        { id: 'rtao-3', label: 'Número de expediente', type: 'form_field', fieldKey: 'expediente', isRequired: true, order: 3, placeholder: 'Ej: SC 2024-12345' },
        { id: 'rtao-4', label: 'Copia del acto administrativo', type: 'document_upload', acceptedFormats: ['PDF'], validatedByAI: false, isRequired: true, order: 4 },
      ],
    },
    {
      code: 'AFEC',
      name: 'Afectaciones (Cesión)',
      isActive: true,
      powerValidityYears: 5,
      requirements: [
        { id: 'afec-1', label: 'Poder firmado por Representante Legal', type: 'digital_signature', templateType: 'poder_simple', isRequired: true, order: 1, description: 'Vigencia de 5 años desde la fecha de firma' },
        { id: 'afec-2', label: 'Denominación de la marca', type: 'form_field', fieldKey: 'denominacion', isRequired: true, order: 2, placeholder: 'Marca objeto de cesión' },
        { id: 'afec-3', label: 'Número de expediente', type: 'form_field', fieldKey: 'expediente', isRequired: true, order: 3, placeholder: 'Ej: SC 2024-12345' },
        { id: 'afec-4', label: 'Descripción de la afectación', type: 'form_field', fieldKey: 'descripcion_afectacion', isRequired: true, order: 4, placeholder: 'Describa el tipo y motivo de la cesión' },
        { id: 'afec-5', label: 'Documento de cesión', type: 'document_upload', acceptedFormats: ['PDF'], validatedByAI: false, isRequired: true, order: 5 },
      ],
    },
    {
      code: 'RMBUSQ',
      name: 'Registro de Marca + Búsqueda de Antecedentes',
      isActive: true,
      powerValidityYears: 5,
      requirements: [
        { id: 'rmbusq-1', label: 'Poder firmado por Representante Legal', type: 'digital_signature', templateType: 'poder_simple', isRequired: true, order: 1, description: 'Vigencia de 5 años desde la fecha de firma' },
        { id: 'rmbusq-2', label: 'Denominación de la marca', type: 'form_field', fieldKey: 'denominacion', isRequired: true, order: 2, placeholder: 'Ej: NOVA TECH' },
        { id: 'rmbusq-3', label: 'Descripción del producto/servicio', type: 'form_field', fieldKey: 'descripcion', isRequired: true, order: 3, placeholder: 'Describa el producto o servicio a registrar' },
        { id: 'rmbusq-4', label: 'Logo de la marca', type: 'document_upload', acceptedFormats: ['PDF', 'JPG', 'PNG'], validatedByAI: false, isRequired: true, order: 4, description: 'Suba el logo en alta resolución' },
        { id: 'rmbusq-5', label: 'Colores del logo (si aplica)', type: 'form_field', fieldKey: 'colores_logo', isRequired: false, order: 5, placeholder: 'Ej: Pantone 286C, o N/A si es en blanco y negro' },
        { id: 'rmbusq-6', label: 'Certificado de existencia y representación legal', type: 'document_upload', acceptedFormats: ['PDF'], validatedByAI: true, isRequired: true, order: 6 },
        { id: 'rmbusq-7', label: 'País de trámite', type: 'form_field', fieldKey: 'pais', isRequired: true, order: 7, placeholder: 'Ej: Colombia, México, Chile' },
      ],
    },
  ];

  for (const type of types) {
    await addDoc(col, {
      ...type,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}
