import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

/** Editorial guide for INFAMOUS only. Never included on other event detail pages. */
@Component({
  selector: 'app-infamous-guide',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="guide" id="informacion-infamous" aria-labelledby="guide-title">
      <div class="heading">
        <span class="eyebrow">ZAIRO / GUÍA OFICIAL</span>
        <h2 id="guide-title">INFAMOUS: todo lo que necesitás saber.</h2>
        <p>El llamado de las almas · 31 de octubre de 2026. Conocé tu experiencia antes de cruzar el portal.</p>
      </div>
      <nav class="quick-links" aria-label="Secciones de la guía">
        <a href="#infamous-horarios">Horarios</a><a href="#infamous-zonas">Zonas</a>
        <a href="#infamous-premios">Premios</a><a href="#infamous-casino">Casino</a>
        <a href="#infamous-preguntas">Preguntas frecuentes</a><a href="#entradas">Comprar entradas</a>
      </nav>
      <div class="facts" id="infamous-horarios">
        <article><span>APERTURA</span><strong>8:00 p. m.</strong><p>31 de octubre</p></article>
        <article><span>FINALIZACIÓN PREVISTA</span><strong>5:00 a. m.</strong><p>1 de noviembre · cualquier extensión estará sujeta a permisos y condiciones operativas.</p></article>
        <article><span>ÚLTIMO INGRESO</span><strong>Por confirmar</strong><p>Consultá los canales oficiales de ZAIRO antes del evento.</p></article>
      </div>
      <section id="infamous-zonas" class="guide-block">
        <span class="eyebrow">ELEGÍ TU EXPERIENCIA</span><h3>General, VIP, mesas y sillones Red Bull</h3>
        <div class="three experiences">
          <article><span class="eyebrow">01 / GENERAL</span><h4>La energía de la fiesta</h4><p>Acceso al área general, pista, escenario y servicios generales del evento. Los precios y la disponibilidad se actualizan en la sección oficial de entradas.</p><a href="#entradas">Ver entradas generales →</a></article>
          <article><span class="eyebrow">02 / RED BULL VIP ZONE</span><h4>Viví INFAMOUS más cerca</h4><p>Zona exclusiva con vista privilegiada al escenario, barra propia, acceso preferencial y ambiente lounge. Una experiencia acompañada por Red Bull y K-NTINA, patrocinadores del evento, con activaciones sujetas a disponibilidad.</p><a href="#entradas">Ver entradas VIP →</a></article>
          <article><span class="eyebrow">03 / MESAS RED BULL</span><h4>Mesa tipo cóctel · 6 entradas VIP</h4><p>Promoción de ₡75.000: 6 entradas VIP, una mesa Red Bull tipo cóctel, 1 litro de Jägermeister y 4 Red Bulls. Los beneficios se comparten por paquete. Disponible para compra cuando se habilite la promoción del evento.</p><a href="#entradas">Ver promoción de mesas →</a></article>
<article><span class="eyebrow">04 / SILLONES RED BULL</span><h4>Experiencia con sillones</h4><p>Espacio con sillones en la zona VIP, 8 Red Bulls y 1 litro de licor a elección. Consultá con ZAIRO las opciones de licor, el precio, los accesos incluidos y la disponibilidad antes de reservar.</p><a href="#infamous-preguntas">Consultar sillones →</a></article>
        </div>
        <p class="note">Los precios de entradas General y VIP se muestran únicamente según el tier activo de este evento. Mesas tipo cóctel y sillones son experiencias diferentes. La promoción de mesas se compra desde las entradas cuando esté habilitada; los sillones se consultan por el canal oficial.</p>
      </section>
      <section class="guide-block" id="infamous-premios">
        <span class="eyebrow">HALLOWEEN / COSTUME AWARDS</span><h3>Tu disfraz puede hacer historia.</h3>
        <div class="awards">
          <article><strong>1.er lugar</strong><p>Premio por confirmar.</p></article>
          <article><strong>2.º lugar</strong><p>Una noche en Hotel &amp; Casino Rancho Mirador + un litro del patrocinador K-NTINA.</p></article>
          <article><strong>3.er lugar</strong><p>Un litro de K-NTINA.</p></article>
        </div>
        <p class="note">El premio del primer lugar, las reglas de participación, la evaluación y las condiciones de entrega se anunciarán por los canales oficiales. Los premios de alcohol son solo para mayores de 18 años.</p>
      </section>
      <section class="guide-block casino" id="infamous-casino">
        <span class="eyebrow">EXPERIENCIA CASINO / +18</span><h3>Las primeras 100 personas tienen una sorpresa.</h3>
        <p>Se contempla un beneficio de ₡2.000 por persona para las primeras 100 personas elegibles. Válido únicamente para mayores de 18 años. La organización comunicará el punto de entrega, el mecanismo, la disponibilidad y las condiciones del casino.</p>
        <p class="note">Este beneficio no equivale a dinero en efectivo ni garantiza ganancias. Su uso depende de las reglas y autorizaciones del operador del casino.</p>
      </section>
      <section class="guide-block" id="infamous-preguntas">
        <span class="eyebrow">YOU ASK / WE ANSWER</span><h3>Preguntas frecuentes</h3>
        <details><summary>¿A qué hora puedo llegar?</summary><p>Las puertas abren a las 8:00 p. m. Recomendamos llegar temprano para aprovechar las actividades. La última hora de ingreso aún está por confirmar.</p></details>
        <details><summary>¿A qué hora termina INFAMOUS?</summary><p>La finalización prevista es a las 5:00 a. m. del 1 de noviembre. Una posible extensión depende de los permisos y las condiciones operativas; no está garantizada.</p></details>
        <details><summary>¿Cuál es la diferencia entre General y VIP?</summary><p>General permite vivir la fiesta desde el área general. VIP ofrece una zona exclusiva con barra propia, acceso preferencial, ambiente lounge y ubicación cercana al escenario.</p></details>
        <details><summary>¿Qué incluye la promoción de mesas Red Bull?</summary><p>Por ₡75.000 incluye 6 entradas VIP, una mesa tipo cóctel, 1 litro de Jägermeister y 4 Red Bulls. Es una mesa, no un sillón. Los beneficios se entregan una vez por paquete, aunque cada persona tenga su propio QR.</p></details>
<details><summary>¿Qué incluyen los sillones Red Bull?</summary><p>Incluyen el espacio con sillones, 8 Red Bulls y 1 litro de licor a elección. Confirmá con ZAIRO las opciones de licor, el precio, los accesos incluidos y la disponibilidad. No forman parte de la promoción de mesas de ₡75.000.</p></details>
        <details><summary>¿Debo llegar disfrazado?</summary><p>Podés disfrutar la fiesta sin participar en el concurso. Si querés concursar, revisá las reglas que anunciará la organización.</p></details>
        <details><summary>¿Qué edades pueden ingresar?</summary><p>No ingresan menores de 16 años. Quienes tengan 16 o 17 deberán realizar su compra junto con una persona adulta responsable e ingresar acompañados por ella, de acuerdo con los requisitos y autorizaciones del recinto. El casino y los premios con alcohol son exclusivos para mayores de 18 años.</p></details>
        <details><summary>¿Cómo recibo mi entrada?</summary><p>Elegí la zona y completá la compra mediante el flujo oficial de ZAIRO. Conservá la confirmación y el código QR de tu entrada.</p></details>
        <details><summary>¿Dónde veo precios, promociones y disponibilidad?</summary><p>En la sección «Elegí tu zona» de esta misma página. Los tiers y sus estados se cargan desde la venta oficial del evento y pueden variar.</p></details>
        <details><summary>¿Puedo salir y volver a ingresar? ¿Habrá parqueo?</summary><p>Las condiciones de reingreso, parqueo y cupos se comunicarán en los canales oficiales. No se garantiza reingreso ni espacio de parqueo sin confirmación.</p></details>
        <details><summary>¿Cómo compro una mesa o reservo sillones?</summary><p>Para mesas tipo cóctel, elegí la promoción de 6 entradas VIP cuando esté habilitada. Para sillones, contactá a ZAIRO por sus canales oficiales antes de realizar el pago.</p></details>
      </section>
      <div class="guide-cta"><p>¿Listo para cruzar el portal?</p><a href="#entradas">Ver entradas disponibles →</a></div>
    </section>`,
  styles: [`
    :host{display:block}.guide{color:#fff;max-width:1200px;width:88%;margin:70px auto;padding:clamp(20px,4vw,48px);background:radial-gradient(ellipse at top right,#71172c55,transparent 50%),#100e14;border:1px solid #ffffff25;border-radius:28px;scroll-margin-top:110px}
    .heading h2{font-size:clamp(29px,4vw,53px);line-height:1.09;margin:8px 0 13px;letter-spacing:-.035em}.heading p{color:#d9cbd0;line-height:1.6}.eyebrow{font-size:11px;color:#ff9cab;letter-spacing:.16em;font-weight:850}.quick-links{display:flex;flex-wrap:wrap;gap:9px;margin:24px 0 32px}.quick-links a{border:1px solid #ffffff38;border-radius:22px;padding:10px 14px;color:#fff;text-decoration:none;font-size:13px}.quick-links a:hover,.three a:hover{background:#ad1738}
    .facts,.three,.awards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.facts article,.three article,.awards article{background:#ffffff0a;border:1px solid #ffffff25;border-radius:18px;padding:21px;min-width:0}.facts span{font-size:11px;letter-spacing:.12em;color:#e9a2b5}.facts strong{font-size:clamp(20px,2vw,29px);display:block;margin:10px 0}.facts p,.three p,.awards p,.guide-block>p{color:#d8cbd1;line-height:1.6}.guide-block{margin-top:46px;scroll-margin-top:110px}.guide-block h3{font-size:clamp(25px,3vw,38px);margin:10px 0 24px}.three h4{font-size:21px;margin:12px 0}.three a,.guide-cta a{display:inline-block;margin-top:10px;color:#ffc7d2;text-underline-offset:4px}.awards{grid-template-columns:repeat(2,minmax(0,1fr))}.awards strong{font-size:20px}.note{font-size:13px;color:#c9b9c0!important}.casino{padding:27px;border:1px solid #bd57684d;border-radius:20px;background:#6b1c2926}.guide details{border-bottom:1px solid #ffffff2b;padding:17px 4px}.guide details summary{cursor:pointer;font-weight:750;line-height:1.4}.guide details p{color:#dacbd2;line-height:1.6;margin:12px 0 4px}.guide-cta{margin-top:35px;padding:23px;border-radius:20px;background:linear-gradient(110deg,#9d1737,#3d1423);display:flex;align-items:center;justify-content:space-between;gap:20px}.guide-cta p{font-size:20px;font-weight:800;margin:0}.guide-cta a{margin:0;color:#fff}.guide a:focus-visible,.guide summary:focus-visible{outline:3px solid #ff91a3;outline-offset:4px}
    .three.experiences{grid-template-columns:repeat(2,minmax(0,1fr))}
    @media(max-width:800px){.guide{width:94%;padding:20px}.facts,.three,.three.experiences{grid-template-columns:1fr}.awards{grid-template-columns:1fr}.guide-cta{flex-direction:column;align-items:flex-start}.guide-block{margin-top:34px}}
  `]
})
export class InfamousGuide {}
