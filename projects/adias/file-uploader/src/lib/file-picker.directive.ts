import {
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnInit,
  Output,
  Renderer2
} from "@angular/core";
import { map } from "rxjs/operators";
import { FilePickerRespnse } from "./file-picker.response";
import { FileUploaderService } from "./file-uploader.service";

@Directive({
  selector: "[ngxFilePicker]"
})
export class FilePickerDirective implements OnInit {
  @Output() uploadSuccess = new EventEmitter<FilePickerRespnse>();
  @Input() fileUrl: string = null;

  element: HTMLElement;
  hoverdDiv: HTMLElement;
  spinnerDiv: HTMLElement;
  input: HTMLElement;
  button: HTMLElement;
  image: HTMLElement;
  uploadedFiles: Array<File>;

  /** disabled till upload */
  mouseoverDisabled = false;

  constructor(
    private elRef: ElementRef,
    private renderer: Renderer2,
    private uploaderService: FileUploaderService
  ) {}

  ngOnInit() {
    this.element = this.elRef.nativeElement;
    this.element.style.position = "relative";
    this.createUploaderElement();
    this.createUploadButton();
    this.createHoveredDiv();
    this.createSpinnerDiv();

    if (this.fileUrl) {
      this.previewImage(this.fileUrl);
    }
  }

  createSpinnerDiv() {
    this.spinnerDiv = this.renderer.createElement("div");
    this.renderer.setStyle(
      this.spinnerDiv,
      "background-color",
      "rgba(0,0,0,0.4)"
    );
    this.renderer.setStyle(this.spinnerDiv, "top", "0");
    this.renderer.setStyle(this.spinnerDiv, "left", "0");
    this.renderer.setStyle(this.spinnerDiv, "height", "100%");
    this.renderer.setStyle(this.spinnerDiv, "width", "100%");
    this.renderer.setStyle(this.spinnerDiv, "position", "absolute");
    this.renderer.setStyle(this.spinnerDiv, "overflow", "auto");
    this.renderer.setStyle(this.spinnerDiv, "display", "none");
    this.renderer.setStyle(this.spinnerDiv, "z-index", "8");

    const image = this.renderer.createElement("img");

    this.renderer.setProperty(
      image,
      "src",
      `https://flevix.com/wp-content/uploads/2019/07/Spinner-Preloader.gif`
    );

    this.renderer.setStyle(image, "height", `100%`);
    this.renderer.setStyle(image, "width", `100%`);
    this.renderer.setStyle(image, "object-fit", `contain`);
    this.renderer.appendChild(this.spinnerDiv, image);
    this.renderer.appendChild(this.element, this.spinnerDiv);
  }

  createHoveredDiv() {
    this.hoverdDiv = this.renderer.createElement("div");
    this.renderer.setStyle(
      this.hoverdDiv,
      "background-color",
      "rgba(0,0,0,0.4)"
    );
    this.renderer.setStyle(this.hoverdDiv, "top", "0");
    this.renderer.setStyle(this.hoverdDiv, "left", "0");
    this.renderer.setStyle(this.hoverdDiv, "height", "100%");
    this.renderer.setStyle(this.hoverdDiv, "width", "100%");
    this.renderer.setStyle(this.hoverdDiv, "position", "absolute");
    this.renderer.setStyle(this.hoverdDiv, "overflow", "auto");
    this.renderer.setStyle(this.hoverdDiv, "display", "none");
    this.renderer.setStyle(this.hoverdDiv, "z-index", "8");
    this.renderer.appendChild(this.element, this.hoverdDiv);
  }

  createUploadButton() {
    this.button = this.renderer.createElement("button");
    this.renderer.setStyle(this.button, "background-color", "#337ab7");
    this.renderer.setStyle(this.button, "border-color", "#2e6da4");
    this.renderer.setStyle(this.button, "color", "#ffff");
    this.renderer.setStyle(this.button, "position", "absolute");
    this.renderer.setStyle(this.button, "top", "0");
    this.renderer.setStyle(this.button, "right", "0");
    this.renderer.setStyle(this.button, "bottom", "0");
    this.renderer.setStyle(this.button, "left", "0");
    this.renderer.setStyle(this.button, "margin", "auto");
    this.renderer.setStyle(this.button, "height", "50px");
    this.renderer.setStyle(this.button, "z-index", "9");
    this.renderer.setStyle(this.button, "width", "120px");
    this.renderer.setStyle(this.button, "font-weight", "600");
    this.renderer.setStyle(this.button, "font-size", "16px");
    this.renderer.setStyle(this.button, "display", "none");
    this.renderer.setProperty(this.button, "type", "button");
    const buttontext = this.renderer.createText("Select File");
    this.renderer.appendChild(this.button, buttontext);
    this.renderer.appendChild(this.element, this.button);
    this.button.addEventListener("click", () => {
      this.input.click();
    });
  }

  createUploaderElement() {
    this.input = this.renderer.createElement("input");
    this.renderer.setProperty(this.input, "type", "file");
    this.renderer.setStyle(this.input, "opacity", "0");
    this.renderer.setStyle(this.input, "height", "100%");
    this.renderer.setStyle(this.input, "width", "100%");
    this.renderer.appendChild(this.element, this.input);
    this.bindEvents();
  }

  bindEvents() {
    this.input.addEventListener("change", ev => {
      const file = (ev as any).target.files[0];
      this.upload(file);
    });
  }

  upload(file: File) {
    this.showSpinner();
    this.mouseoverDisabled = true;
    this.uploaderService
      .upload(file)
      .pipe(
        map((response: any) => {
          if (response && typeof response === "object") {
            if (response.hasOwnProperty("result")) {
              return response["result"];
            } else if (response.hasOwnProperty("data")) {
              return response["data"];
            }
          }

          return response;
        })
      )
      .subscribe({
        next: (response: FilePickerRespnse) => {
          if (response && typeof response === "object") {
            this.uploadSuccess.emit(response);
            this.previewImage(response.fileUrl);
          }
        },
        complete: () => {
          setTimeout(() => {
            this.hideSpinner();
            this.mouseoverDisabled = false;
          }, 2000);
        }
      });
  }

  previewImage(fileUrl: string) {
    this.renderer.setStyle(this.element, "background-image", `url(${fileUrl})`);
    this.renderer.setStyle(this.element, "background-size", `cover`);
  }

  @HostListener("mouseover") onMouseOver() {
    if (this.mouseoverDisabled) {
      return;
    }
    this.addHoverEffect();
    this.showButton();
  }

  @HostListener("mouseout") onMouseOut() {
    this.removeHoverEffect();
    this.hideButton();
  }

  private addHoverEffect() {
    this.renderer.setStyle(this.hoverdDiv, "display", "block");
  }

  private removeHoverEffect() {
    this.renderer.setStyle(this.hoverdDiv, "display", "none");
  }

  private showButton() {
    this.renderer.setStyle(this.button, "display", `block`);
  }

  private hideButton() {
    this.renderer.setStyle(this.button, "display", `none`);
  }

  private showSpinner() {
    this.renderer.setStyle(this.spinnerDiv, "display", `block`);
  }

  private hideSpinner() {
    this.renderer.setStyle(this.spinnerDiv, "display", `none`);
  }
}
// TODO hover karne p upload button ayega uslp click krne p uploa dnput khileha
