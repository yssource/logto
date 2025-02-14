import en from '@logto/phrases-ui/lib/locales/en.js';
import { Provider } from 'oidc-provider';

import { trTrTag, zhCnTag, zhHkTag } from '#src/__mocks__/custom-phrase.js';
import { mockSignInExperience } from '#src/__mocks__/index.js';
import phraseRoutes from '#src/routes/phrase.js';
import { createRequester } from '#src/utils/test-utils.js';

const mockApplicationId = 'mockApplicationIdValue';

const interactionDetails: jest.MockedFunction<() => Promise<unknown>> = jest.fn(async () => ({
  params: { client_id: mockApplicationId },
}));

jest.mock('oidc-provider', () => ({
  Provider: jest.fn(() => ({
    interactionDetails,
  })),
}));

const fallbackLanguage = trTrTag;
const unsupportedLanguageX = 'xx-XX';
const unsupportedLanguageY = 'yy-YY';

const findDefaultSignInExperience = jest.fn(async () => ({
  ...mockSignInExperience,
  languageInfo: {
    autoDetect: true,
    fallbackLanguage,
  },
}));

jest.mock('#src/queries/sign-in-experience.js', () => ({
  findDefaultSignInExperience: async () => findDefaultSignInExperience(),
}));

jest.mock('#src/queries/custom-phrase.js', () => ({
  findAllCustomLanguageTags: async () => [trTrTag, zhCnTag],
}));

jest.mock('#src/lib/phrase.js', () => ({
  ...jest.requireActual('#src/lib/phrase.js'),
  getPhrase: jest.fn().mockResolvedValue(en),
}));

const phraseRequest = createRequester({
  anonymousRoutes: phraseRoutes,
  provider: new Provider(''),
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('when auto-detect is not enabled', () => {
  it('should be English when fallback language is unsupported', async () => {
    findDefaultSignInExperience.mockResolvedValueOnce({
      ...mockSignInExperience,
      languageInfo: {
        autoDetect: false,
        fallbackLanguage: unsupportedLanguageX,
      },
    });
    const response = await phraseRequest
      .get('/phrase')
      .set('Accept-Language', `${zhCnTag},${zhHkTag}`);
    expect(response.headers['content-language']).toEqual('en');
  });

  describe('should be fallback language', () => {
    beforeEach(() => {
      findDefaultSignInExperience.mockResolvedValueOnce({
        ...mockSignInExperience,
        languageInfo: {
          autoDetect: false,
          fallbackLanguage,
        },
      });
    });

    it('when there is no detected language', async () => {
      const response = await phraseRequest.get('/phrase');
      expect(response.headers['content-language']).toEqual(fallbackLanguage);
    });

    it('when there are detected languages', async () => {
      const response = await phraseRequest
        .get('/phrase')
        .set('Accept-Language', `${zhCnTag},${zhHkTag}`);
      expect(response.headers['content-language']).toEqual(fallbackLanguage);
    });
  });
});

describe('when auto-detect is enabled', () => {
  it('should be English when fallback language is unsupported', async () => {
    findDefaultSignInExperience.mockResolvedValueOnce({
      ...mockSignInExperience,
      languageInfo: {
        autoDetect: true,
        fallbackLanguage: unsupportedLanguageX,
      },
    });
    const response = await phraseRequest
      .get('/phrase')
      .set('Accept-Language', unsupportedLanguageY);
    expect(response.headers['content-language']).toEqual('en');
  });

  describe('when fallback language is supported', () => {
    beforeEach(() => {
      findDefaultSignInExperience.mockResolvedValueOnce({
        ...mockSignInExperience,
        languageInfo: {
          autoDetect: true,
          fallbackLanguage,
        },
      });
    });

    describe('when there is no detected language', () => {
      it('should be fallback language from sign-in experience', async () => {
        const response = await phraseRequest.get('/phrase');
        expect(response.headers['content-language']).toEqual(fallbackLanguage);
      });
    });

    describe('when there are detected languages but all of them is unsupported', () => {
      it('should be first supported detected language', async () => {
        const response = await phraseRequest
          .get('/phrase')
          .set('Accept-Language', `${unsupportedLanguageX},${unsupportedLanguageY}`);
        expect(response.headers['content-language']).toEqual(fallbackLanguage);
      });
    });

    describe('when there are detected languages but some of them is unsupported', () => {
      it('should be first supported detected language', async () => {
        const firstSupportedLanguage = zhCnTag;
        const response = await phraseRequest
          .get('/phrase')
          .set('Accept-Language', `${unsupportedLanguageX},${firstSupportedLanguage},${zhHkTag}`);
        expect(response.headers['content-language']).toEqual(firstSupportedLanguage);
      });
    });
  });
});
