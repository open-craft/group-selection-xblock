/**
 * Tests for the api utility (postJson).
 */

import { postJson } from '../../common/api';

describe('postJson', () => {
  beforeEach(() => {
    (global as unknown as Record<string, unknown>).fetch = jest.fn();
  });

  it('calls fetch with the given URL and sends JSON body', async () => {
    const mockFetch = global.fetch as jest.Mock;
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    await postJson('/handler/test', { choice_id: 'abc' });

    expect(mockFetch).toHaveBeenCalledWith('/handler/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': '',
      },
      body: JSON.stringify({ choice_id: 'abc' }),
    });
  });

  it('returns parsed JSON on success', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, choice_id: 'abc' }),
    });

    const result = await postJson('/handler/test', { choice_id: 'abc' });

    expect(result).toEqual({ success: true, choice_id: 'abc' });
  });

  it('throws on non-ok response', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => 'Bad request',
    });

    await expect(postJson('/handler/test', {})).rejects.toThrow(
      'Request failed (400): Bad request'
    );
  });
});
