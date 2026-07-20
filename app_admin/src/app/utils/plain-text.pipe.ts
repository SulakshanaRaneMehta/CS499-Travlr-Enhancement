import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'plainText',
  standalone: true,
  pure: true
})
export class PlainTextPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) {
      return '';
    }

    const document = new DOMParser().parseFromString(value, 'text/html');
    document.body.querySelectorAll('p, div, br, li').forEach((element) => {
      element.append(' ');
    });
    return (document.body.textContent ?? '').replace(/\s+/g, ' ').trim();
  }
}
