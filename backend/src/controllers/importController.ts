import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import * as xlsx from 'xlsx';
import mongoose from 'mongoose';
import Unit from '../models/Unit';
import Resident from '../models/Resident';
import User from '../models/User';

export const parseFile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const condominiumId = req.user!.condominiumId;
    if (!req.file) {
      res.status(400).json({ error: 'Nenhum arquivo enviado.' });
      return;
    }

    const file = req.file;
    const extension = file.originalname.split('.').pop()?.toLowerCase();

    let parsedData: any[] = [];

    if (extension === 'pdf') {
      // Mock logic for PDF parsing since we don't have an AI endpoint configured yet
      // In a real scenario, we would send file.buffer to an OCR/LLM API
      parsedData = [
        { status: 'Revisar', block: '?', number: '?', residentName: '', phone: '', email: '', message: 'Aviso: Leitura inteligente de PDF em desenvolvimento.' }
      ];
    } else if (extension === 'xlsx' || extension === 'csv') {
      const workbook = xlsx.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const json = xlsx.utils.sheet_to_json<any>(sheet);

      parsedData = json.map((row) => {
        // Map common column names
        const number = row['Apto'] || row['Apartamento'] || row['Unidade'] || row['Número'] || row['Numero'] || '';
        const block = row['Bloco'] || row['Torre'] || row['Quadra'] || 'Único';
        const residentName = row['Morador'] || row['Nome'] || row['Responsável'] || row['Inquilino'] || row['Proprietário'] || '';
        const phone = row['Telefone'] || row['Celular'] || row['WhatsApp'] || '';
        const email = row['Email'] || row['E-mail'] || '';

        let rowStatus = 'Pronto';
        let message = '';

        if (!number) {
          rowStatus = 'Campo obrigatório faltando';
          message = 'Número da unidade é obrigatório.';
        }

        return {
          status: rowStatus,
          message,
          block: String(block),
          number: String(number),
          residentName: String(residentName),
          phone: String(phone),
          email: String(email),
        };
      });
    } else {
      res.status(400).json({ error: 'Formato de arquivo não suportado.' });
      return;
    }

    res.json({
      success: true,
      data: parsedData,
    });
  } catch (error: any) {
    console.error('Erro ao fazer parse do arquivo:', error);
    res.status(500).json({ error: 'Erro interno ao ler arquivo.', details: error.message });
  }
};

export const confirmImport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const condominiumId = req.user!.condominiumId;
    const { rows } = req.body;

    if (!Array.isArray(rows) || rows.length === 0) {
      res.status(400).json({ error: 'Nenhum dado para importar.' });
      return;
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    let createdUnits = 0;
    let createdResidents = 0;

    try {
      for (const row of rows) {
        if (row.status !== 'Pronto') continue; // Skip lines that are not ready

        const { block, number, residentName, phone, email } = row;

        // Create or update unit
        let unit = await Unit.findOne({ condominiumId, block, number }).session(session);
        if (!unit) {
          unit = new Unit({
            condominiumId,
            block,
            number,
            status: residentName ? 'occupied' : 'empty',
            type: 'apartment', // Default
          });
          await unit.save({ session });
          createdUnits++;
        }

        // If a resident name was provided, create the resident
        if (residentName) {
          let resident = await Resident.findOne({ condominiumId, unitId: unit._id, name: residentName }).session(session);
          if (!resident) {
            resident = new Resident({
              condominiumId,
              unitId: unit._id,
              name: residentName,
              phone: phone || undefined,
              email: email || undefined,
              type: 'owner', // Default
              isFinancialResponsible: true, // Default
            });
            await resident.save({ session });
            createdResidents++;

            // Optionally create a basic User login if email is provided, but typically done via invite
          }
        }
      }

      await session.commitTransaction();
      session.endSession();

      res.json({
        success: true,
        message: 'Importação concluída com sucesso.',
        stats: {
          createdUnits,
          createdResidents,
        },
      });
    } catch (err: any) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  } catch (error: any) {
    console.error('Erro ao confirmar importação:', error);
    res.status(500).json({ error: 'Erro ao salvar os dados.', details: error.message });
  }
};
