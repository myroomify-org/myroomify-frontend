import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection , importProvidersFrom, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { AuthInterceptor } from './shared/auth/auth-interceptor';

import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { Observable, lastValueFrom, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './shared/auth/auth-service';

export class CustomTranslateLoader implements TranslateLoader {
  constructor(private http: HttpClient) {}

  getTranslation(lang: string): Observable<any> {
    return this.http.get(`./i18n/${lang}.json`)
  }
}

export function httpLoaderFactory(http: HttpClient) {
  return new CustomTranslateLoader(http)
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([AuthInterceptor])),
    importProvidersFrom(
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: httpLoaderFactory,
          deps: [HttpClient]
        },
        defaultLanguage: 'en'
      })
    )
    ,
    {
      provide: APP_INITIALIZER,
      useFactory: (auth: AuthService) => {
        return () => {
          const token = localStorage.getItem('token')
          if (!token) return Promise.resolve()
          return lastValueFrom(auth.refreshProfile$().pipe(catchError(() => of(null))))
        }
      },
      deps: [AuthService],
      multi: true
    }
  ]
}
