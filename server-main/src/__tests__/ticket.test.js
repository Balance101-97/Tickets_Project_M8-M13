import { parseIntParam, normalizeTicketInput } from '../controllers/ticketController.js';
import { parseEvents } from '../services/webhookDispatcher.service.js';
import { describe, it, expect } from '@jest/globals';

describe('parseIntParam', () => {
  it('converte string numérica para inteiro', () => {
    expect(parseIntParam('5', 10)).toBe(5);
  });

  it('devolve fallback se o valor não é um número', () => {
    expect(parseIntParam('abc', 99)).toBe(99);
  });

  it('devolve fallback se o valor é null', () => {
    expect(parseIntParam(null, 42)).toBe(42);
  });
});

describe('normalizeTicketInput', () => {
  it('aceita campos em formato CI_Name', () => {
    const result = normalizeTicketInput({ CI_Name: 'Servidor', CI_Cat: 'Hardware' });
    expect(result.ciName).toBe('Servidor');
    expect(result.ciCat).toBe('Hardware');
  });

  it('aceita campos em camelCase', () => {
    const result = normalizeTicketInput({ ciName: 'Router', status: 'Open' });
    expect(result.ciName).toBe('Router');
    expect(result.status).toBe('Open');
  });
});

describe('parseEvents', () => {
  it('faz parse de um array JSON válido', () => {
    expect(parseEvents('["ticket.created","ticket.deleted"]'))
      .toEqual(['ticket.created', 'ticket.deleted']);
  });

  it('devolve array vazio se o JSON é inválido', () => {
    expect(parseEvents('isto não é json')).toEqual([]);
  });

  it('devolve array vazio se o resultado não é array', () => {
    expect(parseEvents('"apenas uma string"')).toEqual([]);
  });
});